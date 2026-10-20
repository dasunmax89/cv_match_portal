import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CandidateMatch, JobResponse } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-candidate-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candidate-review.component.html',
  styleUrls: ['./candidate-review.component.css']
})
export class CandidateReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public apiService = inject(ApiService);
  public authService = inject(AuthService);

  jobId = signal<string>('');
  jobDetails = signal<JobResponse | null>(null);
  candidates = signal<CandidateMatch[]>([]);
  currentIndex = signal<number>(0);
  viewMode = signal<'stack' | 'table'>('stack');
  selectedTableCandidate = signal<CandidateMatch | null>(null);
  
  isLoading = signal<boolean>(true);
  swipeDirection = signal<'left' | 'right' | null>(null);

  // --- Company Persona AI Sensitivity Threshold ---
  sensitivityThreshold = computed<number>(() => {
    const user = this.authService.recruiterUser();
    const val = user?.aiSensitivity || user?.ai_sensitivity || 'Balanced (65%+)';
    return this.parseSensitivityThreshold(val);
  });

  sensitivityLabel = computed<string>(() => {
    const user = this.authService.recruiterUser();
    return user?.aiSensitivity || user?.ai_sensitivity || 'Balanced (65%+)';
  });

  parseSensitivityThreshold(val: any): number {
    if (!val) return 65;
    if (typeof val === 'number') return val;
    const str = String(val).trim().toLowerCase();
    const match = str.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    if (str.includes('strict')) return 80;
    if (str.includes('flexible')) return 50;
    return 65;
  }

  canShortlist(candidate?: CandidateMatch | null): boolean {
    if (!candidate) return false;
    const score = candidate.evaluation?.overall_match_score ?? 0;
    return score >= this.sensitivityThreshold();
  }

  // --- Interview Scheduling Modal State ---
  isScheduleModalOpen = signal<boolean>(false);
  schedulingCandidate = signal<CandidateMatch | null>(null);
  interviewDate = signal<string>('');
  interviewTime = signal<string>('10:00');
  interviewLocation = signal<string>('');
  interviewCustomMessage = signal<string>('');
  isScheduling = signal<boolean>(false);
  scheduleError = signal<string | null>(null);
  scheduleSuccessMessage = signal<string | null>(null);
  minDate = signal<string>('');

  // --- Toast Notification State ---
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'info' | 'error'>('info');
  private toastTimeout: any = null;

  showToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.viewMode() === 'stack' && !this.selectedTableCandidate()) {
      if (event.key === 'ArrowLeft') {
        this.prevCard();
      } else if (event.key === 'ArrowRight') {
        this.nextCard();
      }
    }
  }

  ngOnInit() {
    this.minDate.set(this.formatDateForInput(new Date()));
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId.set(id);
      this.loadJobDetails(id);
      this.loadCandidates();
    } else {
      this.isLoading.set(false);
    }
  }

  refreshCandidates() {
    this.loadCandidates();
    this.showToast('Candidate list refreshed', 'info');
  }

  private loadJobDetails(id: string) {
    this.apiService.getRecruiterJob(id).subscribe({
      next: (job) => this.jobDetails.set(job),
      error: (err) => console.error('Failed to load job details:', err)
    });
  }

  goBackToJobList() {
    this.router.navigate(['/recruiter/jobs']);
  }

  private loadCandidates() {
    this.isLoading.set(true);
    this.apiService.getJobMatches(this.jobId()).subscribe({
      next: (data) => {
        const sorted = data.sort((a, b) => {
          const scoreA = a.evaluation?.overall_match_score ?? -1;
          const scoreB = b.evaluation?.overall_match_score ?? -1;
          return scoreB - scoreA;
        });
        this.candidates.set(sorted);
        this.isLoading.set(false);

        const targetCandidateId = this.route.snapshot.queryParamMap.get('candidateId');
        if (targetCandidateId) {
          const idx = sorted.findIndex(c => c.id === targetCandidateId || c.candidateEmail?.toLowerCase() === targetCandidateId.toLowerCase());
          if (idx !== -1) {
            this.currentIndex.set(idx);
            this.openCandidateDetails(sorted[idx]);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load candidates', err);
        this.isLoading.set(false);
      }
    });
  }

  get currentCandidate(): CandidateMatch | undefined {
    return this.candidates()[this.currentIndex()];
  }

  prevCard() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    }
  }

  nextCard() {
    if (this.currentIndex() < this.candidates().length - 1) {
      this.currentIndex.update(i => i + 1);
    }
  }

  getScoreColor(score: number | undefined): string {
    if (score === undefined || score === null) return 'text-slate-400';
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  }

  getScoreBg(score: number | undefined): string {
    if (score === undefined || score === null) return 'bg-slate-300';
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  }
  
  getDisplayVerdict(candidate?: CandidateMatch | null): string {
    if (!candidate) return 'Pending';
    if (candidate.status === 'Rejected') return 'Rejected';
    if (candidate.status === 'Shortlisted') return 'Shortlisted';
    return candidate.evaluation?.fit_verdict || candidate.status || 'Pending';
  }

  getVerdictBadgeClass(verdict: string | undefined): string {
    if (!verdict || verdict === 'Pending') return 'bg-slate-100 text-slate-600 border-slate-200';
    if (verdict === 'Rejected') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (verdict === 'Shortlisted') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (verdict === 'Strong Match') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (verdict === 'Moderate Match') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  }

  getBehavioralVerdictBadgeClass(verdict: string | undefined): string {
    if (!verdict) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (verdict === 'RECOMMENDED_FOR_CLIENT_ROUND') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (verdict === 'NEEDS_PROBING') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  }

  reject(candidate?: CandidateMatch) {
    const target = candidate || this.currentCandidate;
    if (!target) return;

    const isStackCard = !this.selectedTableCandidate() && (!candidate || candidate.id === this.currentCandidate?.id);
    if (isStackCard) {
      this.swipeDirection.set('left');
    }

    const currentJobId = this.jobId() || target.jobId;
    this.apiService.updateMatchStatus(currentJobId, target.id, 'Rejected').subscribe({
      next: (updatedMatch) => {
        const updated = updatedMatch || { ...target, status: 'Rejected', interview: undefined };
        this.candidates.update(list => list.map(c => c.id === target.id ? { ...c, ...updated, status: 'Rejected', interview: undefined } : c));
        if (this.selectedTableCandidate()?.id === target.id) {
          this.selectedTableCandidate.update(c => c ? { ...c, ...updated, status: 'Rejected', interview: undefined } : null);
        }
        this.showToast(`Candidate ${target.candidateName || ''} marked as Rejected`, 'info');
      },
      error: (err) => {
        console.error('Reject failed', err);
        this.showToast('Failed to reject candidate. Please try again.', 'error');
      }
    });

    if (isStackCard) {
      setTimeout(() => {
        this.swipeDirection.set(null);
        if (this.viewMode() === 'stack' && this.currentIndex() < this.candidates().length - 1) {
          this.nextCard();
        }
      }, 300);
    }
  }

  formatDateForInput(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDefaultTomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return this.formatDateForInput(d);
  }

  setQuickDate(daysFromNow: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    this.interviewDate.set(this.formatDateForInput(d));
  }

  setQuickTime(time: string) {
    this.interviewTime.set(time);
  }

  setQuickLocation(loc: string) {
    this.interviewLocation.set(loc);
  }

  openScheduleModal(candidate?: CandidateMatch) {
    const target = candidate || this.currentCandidate;
    if (!target) return;

    if (!this.canShortlist(target)) {
      const score = target.evaluation?.overall_match_score ?? 0;
      alert(`Cannot shortlist candidate: Overall match score (${score}%) is below your Company Persona AI Screening Sensitivity Threshold (${this.sensitivityThreshold()}% - ${this.sensitivityLabel()}).`);
      return;
    }

    this.schedulingCandidate.set(target);
    this.interviewDate.set(this.getDefaultTomorrow());
    this.interviewTime.set('10:00');
    this.interviewLocation.set('');
    this.interviewCustomMessage.set('');
    this.scheduleError.set(null);
    this.scheduleSuccessMessage.set(null);
    this.isScheduling.set(false);
    this.isScheduleModalOpen.set(true);
  }

  closeScheduleModal() {
    this.isScheduleModalOpen.set(false);
    this.schedulingCandidate.set(null);
    this.scheduleError.set(null);
    this.scheduleSuccessMessage.set(null);
  }

  confirmScheduleAndShortlist() {
    const target = this.schedulingCandidate();
    if (!target) return;

    if (!this.canShortlist(target)) {
      const score = target.evaluation?.overall_match_score ?? 0;
      this.scheduleError.set(
        `Cannot shortlist: Candidate match score (${score}%) is below your Company Persona Screening Sensitivity Threshold (${this.sensitivityThreshold()}%).`
      );
      return;
    }

    const dateVal = this.interviewDate();
    const timeVal = this.interviewTime();
    const locVal = this.interviewLocation().trim();
    const customMsg = this.interviewCustomMessage().trim();

    if (!dateVal) {
      this.scheduleError.set('Please select an interview date.');
      return;
    }
    if (!timeVal) {
      this.scheduleError.set('Please select an interview time.');
      return;
    }
    if (!locVal) {
      this.scheduleError.set('Please provide an interview location (Map URL, physical address, or meeting link).');
      return;
    }

    this.isScheduling.set(true);
    this.scheduleError.set(null);

    const scheduledAt = `${dateVal}T${timeVal}:00`;
    const user = this.authService.recruiterUser();

    this.apiService.updateMatchStatus(
      this.jobId(), 
      target.id, 
      'Shortlisted', 
      {
        scheduled_at: scheduledAt,
        location: locVal,
        custom_message: customMsg || undefined
      },
      this.sensitivityThreshold(),
      user?.workEmail || user?.email
    ).subscribe({
      next: (updatedMatch) => {
        this.candidates.update(list => list.map(c => c.id === target.id ? updatedMatch : c));
        if (this.selectedTableCandidate()?.id === target.id) {
          this.selectedTableCandidate.set(updatedMatch);
        }
        this.isScheduling.set(false);
        this.scheduleSuccessMessage.set(`Interview scheduled! Invitation email sent to ${target.candidateEmail}`);
        
        setTimeout(() => {
          const wasStackCurrent = !this.selectedTableCandidate() && this.currentCandidate?.id === target.id;
          this.closeScheduleModal();
          if (this.viewMode() === 'stack' && wasStackCurrent && this.currentIndex() < this.candidates().length - 1) {
            this.nextCard();
          }
        }, 1200);
      },
      error: (err) => {
        console.error('Shortlist and schedule failed', err);
        this.isScheduling.set(false);
        this.scheduleError.set(err?.error?.detail || 'Failed to schedule interview. Please try again.');
      }
    });
  }

  shortlist(candidate?: CandidateMatch) {
    this.openScheduleModal(candidate);
  }

  openCandidateDetails(candidate: CandidateMatch) {
    this.selectedTableCandidate.set(candidate);
  }

  closeCandidateDetails() {
    this.selectedTableCandidate.set(null);
  }

  formatDisplayDate(dtStr?: string): string {
    if (!dtStr) return 'To be confirmed';
    try {
      const dt = new Date(dtStr);
      if (isNaN(dt.getTime())) return dtStr;
      return dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dtStr;
    }
  }

  getCandidateGaps(candidate?: CandidateMatch | null): string[] {
    if (!candidate) return [];
    const evalData = candidate.evaluation as any;
    const cvGaps = (evalData?.gaps_and_red_flags && evalData.gaps_and_red_flags.length > 0)
      ? evalData.gaps_and_red_flags
      : (evalData?.identified_gaps || []);
    const behFlags = candidate.behavioral_evaluation?.risk_flags || [];
    
    const combined = [...cvGaps];
    for (const flag of behFlags) {
      if (!combined.some(g => g.trim().toLowerCase() === flag.trim().toLowerCase())) {
        combined.push(flag);
      }
    }
    return combined;
  }

  getCandidateSelectedKey(candidate: CandidateMatch, questionId: string): string | null {
    if (!candidate.candidate_answers) return null;
    const ans = candidate.candidate_answers.find(a => a.question_id === questionId);
    return ans ? ans.selected_key : null;
  }
}


