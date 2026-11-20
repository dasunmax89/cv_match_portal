import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CandidateMatch, JobResponse } from '../../../core/models/candidate.models';
import { OfferDraftModalComponent } from '../offer-draft-modal/offer-draft-modal.component';

@Component({
  selector: 'app-candidate-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OfferDraftModalComponent],
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

  canDraftOffer(candidate?: CandidateMatch | null): boolean {
    if (!candidate || candidate.status === 'Rejected') return false;
    // If an offer already exists (Draft, Offered, Accepted), allow reviewing or editing
    if (candidate.offer) return true;
    // New offers should only be available once the candidate has completed and passed the interview
    return candidate.interview?.outcome === 'Passed' || candidate.status === 'Interview Passed';
  }

  // --- Interview Scheduling Modal State ---
  isScheduleModalOpen = signal<boolean>(false);
  schedulingCandidate = signal<CandidateMatch | null>(null);
  interviewDate = signal<string>('');
  interviewTime = signal<string>('10:00');
  interviewStartTime = signal<string>('10:00');
  interviewEndTime = signal<string>('11:00');
  interviewDurationMinutes = signal<number>(60);
  interviewerInput = signal<string>('');
  interviewerEmails = signal<string[]>([]);
  interviewerEmailError = signal<string | null>(null);
  interviewLocation = signal<string>('');
  interviewCustomMessage = signal<string>('');
  isScheduling = signal<boolean>(false);
  scheduleError = signal<string | null>(null);
  scheduleSuccessMessage = signal<string | null>(null);
  minDate = signal<string>('');

  // --- Offer Drafting Modal State ---
  isOfferModalOpen = signal<boolean>(false);
  offerTargetCandidate = signal<CandidateMatch | null>(null);

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
    if (score === undefined || score === null) return 'text-[#4E6770]';
    if (score >= 75) return 'text-[#244653]';
    if (score >= 50) return 'text-[#244653]';
    return 'text-rose-600';
  }

  getScoreBg(score: number | undefined): string {
    if (score === undefined || score === null) return 'bg-[#D5EDED]';
    if (score >= 75) return 'bg-[#71C9CE]';
    if (score >= 50) return 'bg-[#A6E3E9]';
    return 'bg-rose-400';
  }
  
  getDisplayVerdict(candidate?: CandidateMatch | null): string {
    if (!candidate) return 'Pending';
    if (candidate.status === 'Rejected') return 'Rejected';
    if (candidate.status === 'Shortlisted') return 'Shortlisted';
    return candidate.evaluation?.fit_verdict || candidate.status || 'Pending';
  }

  getVerdictBadgeClass(verdict: string | undefined): string {
    if (!verdict || verdict === 'Pending') return 'bg-[#F8FBFA] text-[#4E6770] border-[#D5EDED]';
    if (verdict === 'Rejected') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (verdict === 'Shortlisted') return 'bg-[#CBF1F5] text-[#244653] border-[#71C9CE] font-bold';
    if (verdict === 'Strong Match') return 'bg-[#CBF1F5] text-[#244653] border-[#71C9CE] font-bold';
    if (verdict === 'Moderate Match') return 'bg-[#E3FDFD] text-[#244653] border-[#A6E3E9] font-semibold';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  getBehavioralVerdictBadgeClass(verdict: string | undefined): string {
    if (!verdict) return 'bg-[#F8FBFA] text-[#4E6770] border-[#D5EDED]';
    if (verdict === 'RECOMMENDED_FOR_CLIENT_ROUND') return 'bg-[#CBF1F5] text-[#244653] border-[#71C9CE] font-bold';
    if (verdict === 'NEEDS_PROBING') return 'bg-[#E3FDFD] text-[#244653] border-[#A6E3E9] font-semibold';
    return 'bg-rose-50 text-rose-700 border-rose-200';
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
    this.onStartTimeChange(time);
  }

  setQuickLocation(loc: string) {
    this.interviewLocation.set(loc);
  }

  calculateEndTime(start: string, durationMin: number): string {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '';
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  calculateDuration(start: string, end: string): number {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  }

  onStartTimeChange(newStart: string) {
    this.interviewStartTime.set(newStart);
    this.interviewTime.set(newStart);
    const dur = this.interviewDurationMinutes();
    if (dur > 0) {
      this.interviewEndTime.set(this.calculateEndTime(newStart, dur));
    }
  }

  onEndTimeChange(newEnd: string) {
    this.interviewEndTime.set(newEnd);
    const dur = this.calculateDuration(this.interviewStartTime(), newEnd);
    if (dur > 0) {
      this.interviewDurationMinutes.set(dur);
    }
  }

  setDuration(minutes: number) {
    this.interviewDurationMinutes.set(minutes);
    this.interviewEndTime.set(this.calculateEndTime(this.interviewStartTime(), minutes));
  }

  setQuickStartTime(time: string) {
    this.onStartTimeChange(time);
  }

  getDurationDisplay(): string {
    const mins = this.interviewDurationMinutes();
    if (mins <= 0) return 'Invalid duration';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''}`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (remMins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${remMins} min${remMins > 1 ? 's' : ''}`;
  }

  addInterviewerEmail() {
    const raw = this.interviewerInput().trim().toLowerCase();
    this.interviewerEmailError.set(null);
    if (!raw) return;

    const parts = raw.split(/[,;\s]+/).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const current = [...this.interviewerEmails()];

    for (const email of parts) {
      if (!emailRegex.test(email)) {
        this.interviewerEmailError.set(`"${email}" is not a valid email address.`);
        return;
      }
      if (current.includes(email)) {
        this.interviewerEmailError.set(`"${email}" has already been added.`);
        return;
      }
      current.push(email);
    }

    this.interviewerEmails.set(current);
    this.interviewerInput.set('');
  }

  removeInterviewerEmail(emailToRemove: string) {
    this.interviewerEmails.update(list => list.filter(e => e !== emailToRemove));
    this.interviewerEmailError.set(null);
  }

  openScheduleModal(candidate?: CandidateMatch) {
    const target = candidate || this.currentCandidate;
    if (!target) return;

    if (!this.canShortlist(target)) {
      const score = target.evaluation?.overall_match_score ?? 0;
      alert(`Cannot shortlist candidate: Overall match score (${score}%) is below your Company Persona AI Screening Sensitivity Threshold (${this.sensitivityThreshold()}% - ${this.sensitivityLabel()}).`);
      return;
    }

    const existing = target.interview;
    this.schedulingCandidate.set(target);
    this.interviewDate.set(existing?.scheduled_at ? existing.scheduled_at.split('T')[0] : this.getDefaultTomorrow());
    
    const startTime = existing?.start_time || (existing?.scheduled_at?.includes('T') ? existing.scheduled_at.split('T')[1].substring(0, 5) : '10:00');
    const duration = existing?.duration_minutes || 60;
    const endTime = existing?.end_time || this.calculateEndTime(startTime, duration);

    this.interviewStartTime.set(startTime);
    this.interviewTime.set(startTime);
    this.interviewDurationMinutes.set(duration);
    this.interviewEndTime.set(endTime);
    this.interviewLocation.set(existing?.location || '');
    this.interviewCustomMessage.set(existing?.custom_message || '');
    this.interviewerEmails.set(existing?.interviewers ? [...existing.interviewers] : []);
    this.interviewerInput.set('');
    this.interviewerEmailError.set(null);
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
    this.interviewerEmailError.set(null);
    this.interviewerInput.set('');
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

    // Auto-add any pending email typed in the interviewer input field
    if (this.interviewerInput().trim()) {
      this.addInterviewerEmail();
      if (this.interviewerEmailError()) {
        this.scheduleError.set(this.interviewerEmailError());
        return;
      }
    }

    const dateVal = this.interviewDate();
    const startTimeVal = this.interviewStartTime() || this.interviewTime();
    const endTimeVal = this.interviewEndTime();
    const durationMin = this.interviewDurationMinutes();
    const locVal = this.interviewLocation().trim();
    const customMsg = this.interviewCustomMessage().trim();
    const interviewersList = this.interviewerEmails();

    if (!dateVal) {
      this.scheduleError.set('Please select an interview date.');
      return;
    }
    if (!startTimeVal) {
      this.scheduleError.set('Please select an interview start time.');
      return;
    }
    if (!endTimeVal) {
      this.scheduleError.set('Please select an interview end time.');
      return;
    }
    if (durationMin <= 0) {
      this.scheduleError.set('Interview end time must be after the start time.');
      return;
    }
    if (!locVal) {
      this.scheduleError.set('Please provide an interview location (Map URL, physical address, or meeting link).');
      return;
    }

    this.isScheduling.set(true);
    this.scheduleError.set(null);

    const scheduledAt = `${dateVal}T${startTimeVal}:00`;
    const user = this.authService.recruiterUser();

    this.apiService.updateMatchStatus(
      this.jobId(), 
      target.id, 
      'Shortlisted', 
      {
        scheduled_at: scheduledAt,
        start_time: startTimeVal,
        end_time: endTimeVal,
        duration_minutes: durationMin,
        interviewers: interviewersList,
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
        const invCount = interviewersList.length;
        const invNotice = invCount > 0 ? ` and ${invCount} interviewer${invCount > 1 ? 's' : ''}` : '';
        this.scheduleSuccessMessage.set(`Interview scheduled! Invitation email sent to ${target.candidateEmail}${invNotice}.`);
        
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

  // --- Offer Drafting Actions ---
  openOfferModal(candidate?: CandidateMatch, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const target = candidate || this.currentCandidate;
    if (!target) return;
    if (!this.canDraftOffer(target)) {
      this.showToast('Contract offers can only be drafted after the candidate has completed and passed the interview.', 'info');
      return;
    }
    this.offerTargetCandidate.set(target);
    this.isOfferModalOpen.set(true);
  }

  closeOfferModal() {
    this.isOfferModalOpen.set(false);
    this.offerTargetCandidate.set(null);
  }

  onOfferSaved(event: { match: any; isDraft: boolean }) {
    const target = this.offerTargetCandidate();
    if (!target) return;

    const updated = event.match || {
      ...target,
      status: event.isDraft ? 'Offer Drafting' : 'Offer Extended',
      offer: event.match?.offer || target.offer
    };

    this.candidates.update(list => list.map(c => c.id === target.id ? { ...c, ...updated } : c));
    if (this.selectedTableCandidate()?.id === target.id) {
      this.selectedTableCandidate.update(c => c ? { ...c, ...updated } : null);
    }
    this.showToast(
      event.isDraft 
        ? `Offer draft saved for ${target.candidateName} (Candidate not notified)` 
        : `Official employment offer dispatched to ${target.candidateName}!`,
      'success'
    );
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}


