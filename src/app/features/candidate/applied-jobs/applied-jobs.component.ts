import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CandidateApplication,
  ContractOffer,
  POPULAR_CURRENCIES,
  SignOfferRequest,
  DeclineOfferRequest
} from '../../../core/models/candidate.models';

@Component({
  selector: 'app-candidate-applied-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applied-jobs.component.html'
})
export class CandidateAppliedJobsComponent implements OnInit {
  private apiService = inject(ApiService);
  public authService = inject(AuthService);
  private router = inject(Router);

  applications = signal<CandidateApplication[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<'all' | 'interview' | 'shortlisted' | 'pending' | 'offers'>('all');
  selectedJobForModal = signal<CandidateApplication | null>(null);

  // Contract Offer Review & E-Signature State
  selectedOfferForModal = signal<CandidateApplication | null>(null);
  legalSignatureName = signal<string>('');
  agreeToOfferTerms = signal<boolean>(false);
  declineReason = signal<string>('');
  showDeclinePrompt = signal<boolean>(false);
  isOfferSubmitting = signal<boolean>(false);
  offerActionError = signal<string | null>(null);
  offerActionSuccess = signal<string | null>(null);
  popularCurrencies = POPULAR_CURRENCIES;

  ngOnInit() {
    this.fetchAppliedJobs();
  }

  fetchAppliedJobs() {
    this.isLoading.set(true);
    const user = this.authService.candidateUser();
    const email = user?.email || user?.candidateEmail || '';

    this.apiService.getCandidateAppliedJobs(email).subscribe({
      next: (data) => {
        this.applications.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidate applied jobs:', err);
        this.isLoading.set(false);
      }
    });
  }

  get filteredApplications(): CandidateApplication[] {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedStatusFilter();

    return this.applications().filter(app => {
      const matchesSearch = !q || (
        app.jobTitle.toLowerCase().includes(q) ||
        (app.seniorityLevel && app.seniorityLevel.toLowerCase().includes(q)) ||
        (app.requiredSkills && app.requiredSkills.some(s => s.toLowerCase().includes(q)))
      );
      if (!matchesSearch) return false;

      if (filter === 'offers') {
        return !!app.offer && app.offer.status !== 'Draft';
      }
      if (filter === 'interview') {
        return !!app.interview?.scheduled_at;
      }
      if (filter === 'shortlisted') {
        return app.status?.toLowerCase() === 'shortlisted';
      }
      if (filter === 'pending') {
        return !app.interview?.scheduled_at && !app.offer && app.status?.toLowerCase() !== 'shortlisted' && app.status?.toLowerCase() !== 'rejected';
      }
      return true;
    });
  }

  get totalApplicationsCount(): number {
    return this.applications().length;
  }

  get offersCount(): number {
    return this.applications().filter(a => !!a.offer && a.offer.status === 'Offered').length;
  }

  get shortlistedCount(): number {
    return this.applications().filter(a => a.status?.toLowerCase() === 'shortlisted').length;
  }

  get interviewCount(): number {
    return this.applications().filter(a => !!a.interview?.scheduled_at).length;
  }

  get pendingCount(): number {
    return this.applications().filter(a => 
      !a.interview?.scheduled_at && !a.offer && a.status?.toLowerCase() !== 'shortlisted' && a.status?.toLowerCase() !== 'rejected'
    ).length;
  }

  openJobModal(app: CandidateApplication) {
    this.selectedJobForModal.set(app);
  }

  closeJobModal() {
    this.selectedJobForModal.set(null);
  }

  // --- Contract Offer Review & E-Signature Handlers ---
  openOfferModal(app: CandidateApplication) {
    this.selectedOfferForModal.set(app);
    this.offerActionError.set(null);
    this.offerActionSuccess.set(null);
    this.showDeclinePrompt.set(false);
    this.declineReason.set('');
    this.agreeToOfferTerms.set(false);

    const user = this.authService.candidateUser();
    const candidateName = user?.name || user?.candidateName || '';
    this.legalSignatureName.set(app.offer?.signed_name || candidateName);
  }

  closeOfferModal() {
    this.selectedOfferForModal.set(null);
    this.offerActionError.set(null);
    this.offerActionSuccess.set(null);
    this.showDeclinePrompt.set(false);
  }

  submitSignOffer() {
    const app = this.selectedOfferForModal();
    if (!app || !app.id) return;

    const signature = this.legalSignatureName().trim();
    if (!signature) {
      this.offerActionError.set('Please type your legal full name as your electronic signature.');
      return;
    }

    if (!this.agreeToOfferTerms()) {
      this.offerActionError.set('Please check the confirmation box to agree to the employment contract terms.');
      return;
    }

    this.isOfferSubmitting.set(true);
    this.offerActionError.set(null);

    const user = this.authService.candidateUser();
    const candidateEmail = user?.email || user?.candidateEmail || undefined;

    const payload: SignOfferRequest = {
      legal_name: signature,
      signed_name: signature,
      candidate_email: candidateEmail
    };

    this.apiService.candidateSignOffer(app.id, payload).subscribe({
      next: (updatedOffer) => {
        this.isOfferSubmitting.set(false);
        this.offerActionSuccess.set('🎉 Congratulations! You have successfully signed and accepted the contract offer!');

        // Update local application record
        const updatedList = this.applications().map(a => {
          if (a.id === app.id) {
            return {
              ...a,
              status: 'Placed',
              offer: updatedOffer
            };
          }
          return a;
        });
        this.applications.set(updatedList);

        // Update active modal reference
        const currentModal = this.selectedOfferForModal();
        if (currentModal && currentModal.id === app.id) {
          this.selectedOfferForModal.set({
            ...currentModal,
            status: 'Placed',
            offer: updatedOffer
          });
        }
      },
      error: (err) => {
        this.isOfferSubmitting.set(false);
        console.error('Failed to sign offer:', err);
        const detail = err?.error?.detail;
        let errorMsg = 'Failed to sign the offer. Please try again or contact your recruiter.';
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (err?.message) {
          errorMsg = err.message;
        }
        this.offerActionError.set(errorMsg);
      }
    });
  }

  submitDeclineOffer() {
    const app = this.selectedOfferForModal();
    if (!app || !app.id) return;

    this.isOfferSubmitting.set(true);
    this.offerActionError.set(null);

    const user = this.authService.candidateUser();
    const candidateEmail = user?.email || user?.candidateEmail || undefined;

    const payload: DeclineOfferRequest = {
      reason: this.declineReason().trim() || undefined,
      candidate_email: candidateEmail
    };

    this.apiService.candidateDeclineOffer(app.id, payload).subscribe({
      next: (updatedOffer) => {
        this.isOfferSubmitting.set(false);
        this.offerActionSuccess.set('You have declined this offer. Your recruiter and the hiring company have been notified.');

        // Update local application record
        const updatedList = this.applications().map(a => {
          if (a.id === app.id) {
            return {
              ...a,
              status: 'Rejected',
              offer: updatedOffer
            };
          }
          return a;
        });
        this.applications.set(updatedList);

        setTimeout(() => {
          this.closeOfferModal();
        }, 1800);
      },
      error: (err) => {
        this.isOfferSubmitting.set(false);
        console.error('Failed to decline offer:', err);
        const detail = err?.error?.detail;
        let errorMsg = 'Failed to record decision. Please try again.';
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (err?.message) {
          errorMsg = err.message;
        }
        this.offerActionError.set(errorMsg);
      }
    });
  }

  getCurrencySymbol(code?: string): string {
    const found = this.popularCurrencies.find(c => c.code === (code || '').toUpperCase());
    return found ? found.symbol : (code || 'CHF');
  }

  formatCurrency(val?: number, currencyCode: string = 'CHF'): string {
    if (val === undefined || val === null) return '-';
    const sym = this.getCurrencySymbol(currencyCode);
    return `${sym} ${val.toLocaleString()}`;
  }

  getStatusBadgeClass(status?: string, hasInterview?: boolean, offer?: ContractOffer): string {
    if (offer?.status === 'Accepted' || status === 'Placed') {
      return 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-extrabold shadow-2xs';
    }
    if (offer?.status === 'Offered' || status === 'Offered') {
      return 'bg-[#244653] text-[#CBF1F5] border border-[#244653] font-black animate-pulse';
    }
    if (offer?.status === 'Draft' || status === 'Offer Drafting') {
      return 'bg-[#E3FDFD] text-[#244653] border border-[#A6E3E9] font-semibold';
    }
    if (offer?.status === 'Declined') {
      return 'bg-slate-150 text-slate-700 border-slate-300 font-semibold';
    }
    if (status === 'Interview Passed') return 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-bold';
    if (hasInterview) return 'bg-[#E3FDFD] text-[#244653] border border-[#A6E3E9] font-semibold';
    if (!status) return 'bg-[#F8FBFA] text-[#4E6770] border border-[#D5EDED]';
    const s = status.toLowerCase();
    if (s === 'shortlisted') return 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-semibold';
    if (s.includes('strong')) return 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-semibold';
    if (s.includes('moderate')) return 'bg-[#E3FDFD] text-[#244653] border border-[#A6E3E9] font-medium';
    if (s === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]';
  }

  getStatusLabel(app: CandidateApplication): string {
    if (app.offer?.status === 'Accepted' || app.status === 'Placed') return 'Contract Signed ✓';
    if (app.offer?.status === 'Offered' || app.status === 'Offered') return '🎉 Contract Offered!';
    if (app.offer?.status === 'Draft' || app.status === 'Offer Drafting') return 'Offer In Preparation 📝';
    if (app.offer?.status === 'Declined') return 'Offer Declined';
    if (app.status === 'Interview Passed' || app.interview?.outcome === 'Passed') return 'Interview Passed ✓';
    if (app.status === 'Rejected' && app.interview?.outcome === 'Failed') return 'Interview Concluded';
    if (app.interview?.scheduled_at) return 'Interview Scheduled';
    if (app.status === 'Shortlisted') return 'Shortlisted';
    if (app.evaluation?.fit_verdict) return app.evaluation.fit_verdict;
    return app.status || 'Under Review';
  }

  formatDisplayDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  isMapUrl(str?: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.startsWith('http://') || s.startsWith('https://') || s.includes('maps.google') || s.includes('goo.gl');
  }
}

