import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  RecruiterInterviewsOverviewResponse,
  JobInterviewsGroup,
  ScheduledInterviewItem,
  InterviewResult,
  InterviewDecisionRequest,
  SaveInterviewNotesRequest,
  POPULAR_CURRENCIES,
  CurrencyOption,
  CreateOfferRequest,
  ContractOffer,
  InviteeEvaluation
} from '../../../core/models/candidate.models';
import { OfferDraftModalComponent } from '../offer-draft-modal/offer-draft-modal.component';

@Component({
  selector: 'app-recruiter-interviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, OfferDraftModalComponent],
  templateUrl: './interviews.component.html'
})
export class RecruiterInterviewsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  activeFilter = signal<'all' | 'today_upcoming' | 'needs_eval' | 'passed' | 'offers_drafting' | 'offers_extended' | 'offers_accepted' | 'failed'>('all');

  overviewData = signal<RecruiterInterviewsOverviewResponse | null>(null);
  expandedJobs = signal<Set<string>>(new Set());

  // Evaluation Drawer State
  selectedInterview = signal<ScheduledInterviewItem | null>(null);
  isDrawerOpen = signal<boolean>(false);
  drawerStep = signal<'evaluation' | 'confirmation'>('evaluation');

  // Scorecard / Notes Form State
  rating = signal<number>(5);
  technicalScore = signal<number>(4);
  cultureScore = signal<number>(4);
  communicationScore = signal<number>(4);
  internalNotes = signal<string>('');
  candidateFeedback = signal<string>('');
  checkedProbes = signal<Set<string>>(new Set());

  // Decision State
  pendingOutcome = signal<'Passed' | 'Failed'>('Passed');
  customEmailMessage = signal<string>('');
  notifyCandidate = signal<boolean>(true);
  decisionError = signal<string | null>(null);
  decisionSuccess = signal<string | null>(null);

  // Contract Offer Modal State
  popularCurrencies = POPULAR_CURRENCIES;
  isOfferDrawerOpen = signal<boolean>(false);
  offerInterview = signal<ScheduledInterviewItem | null>(null);

  // Finish Interview Action & Toast State
  finishSuccessToast = signal<string | null>(null);

  // Panel Invitee Feedback & Consensus Calculations
  panelEvaluations = computed<InviteeEvaluation[]>(() => {
    const item = this.selectedInterview();
    if (!item) return [];
    const fromInterview = item.interview?.invitee_evaluations || item.interview?.evaluations || item.evaluations || [];
    const interviewers = item.interview?.interviewers || [];

    const map = new Map<string, InviteeEvaluation>();
    for (const ev of fromInterview) {
      if (ev.email) map.set(ev.email.toLowerCase().trim(), ev);
    }

    const result: InviteeEvaluation[] = [];
    for (const email of interviewers) {
      const clean = email.toLowerCase().trim();
      if (map.has(clean)) {
        result.push(map.get(clean)!);
        map.delete(clean);
      } else {
        result.push({
          id: clean,
          email: clean,
          status: 'pending'
        });
      }
    }
    for (const remaining of map.values()) {
      result.push(remaining);
    }
    return result;
  });

  isPanelEvaluationResolved(status?: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return s === 'given' || s === 'submitted' || s === 'not opt in' || s === 'declined' || s === 'opt_out' || s === 'opted out' || s === 'opted_out';
  }

  hasPendingPanelFeedback = computed<boolean>(() => {
    const evals = this.panelEvaluations();
    if (!evals || evals.length === 0) return false;
    return evals.some(e => !this.isPanelEvaluationResolved(e.status));
  });

  pendingPanelistsCount = computed<number>(() => {
    const evals = this.panelEvaluations();
    if (!evals || evals.length === 0) return 0;
    return evals.filter(e => !this.isPanelEvaluationResolved(e.status)).length;
  });

  canPassInterview = computed<boolean>(() => {
    return !this.hasPendingPanelFeedback();
  });

  panelConsensus = computed(() => {
    const evals = this.panelEvaluations();
    const givenList = evals.filter(e => e.status === 'given');
    const givenCount = givenList.length;
    const totalInvited = evals.length;
    const pendingCount = evals.filter(e => !this.isPanelEvaluationResolved(e.status)).length;
    const notOptInCount = evals.filter(e => {
      const s = (e.status || '').toLowerCase().trim();
      return s === 'not opt in' || s === 'declined' || s === 'opt_out' || s === 'opted out' || s === 'opted_out';
    }).length;

    if (givenCount === 0) {
      return {
        hasGiven: false,
        totalInvited,
        givenCount,
        pendingCount,
        notOptInCount,
        avgRating: 0,
        avgTech: 0,
        avgCulture: 0,
        avgComm: 0,
        avgRatingDisplay: '0.0',
        avgTechDisplay: '0.0',
        avgCultureDisplay: '0.0',
        avgCommDisplay: '0.0'
      };
    }

    const sumRating = givenList.reduce((acc, e) => acc + (e.rating || 0), 0);
    const sumTech = givenList.reduce((acc, e) => acc + (e.technical_score || 0), 0);
    const sumCulture = givenList.reduce((acc, e) => acc + (e.culture_score || 0), 0);
    const sumComm = givenList.reduce((acc, e) => acc + (e.communication_score || 0), 0);

    const avgRating = sumRating / givenCount;
    const avgTech = sumTech / givenCount;
    const avgCulture = sumCulture / givenCount;
    const avgComm = sumComm / givenCount;

    return {
      hasGiven: true,
      totalInvited,
      givenCount,
      pendingCount,
      notOptInCount,
      avgRating,
      avgTech,
      avgCulture,
      avgComm,
      avgRatingDisplay: avgRating.toFixed(1),
      avgTechDisplay: avgTech.toFixed(1),
      avgCultureDisplay: avgCulture.toFixed(1),
      avgCommDisplay: avgComm.toFixed(1)
    };
  });

  isInterviewFinished(item: ScheduledInterviewItem): boolean {
    if (item.interview?.is_finished) return true;
    if (item.interview?.status === 'Completed') return true;
    if (item.interview?.outcome) return true;
    if (item.status === 'Interview Passed' || item.status === 'Rejected') return true;
    return false;
  }

  finishInterview(item: ScheduledInterviewItem, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.isActionLoading.set(true);
    this.apiService.finishInterview(item.jobId, item.id).subscribe({
      next: (updatedMatch) => {
        this.isActionLoading.set(false);
        this.updateLocalInterviewData(item.jobId, item.id, updatedMatch);
        const invCount = item.interview?.interviewers?.length || 0;
        const msg = invCount > 0
          ? `Interview marked as finished! Feedback links & secret verification codes emailed to ${invCount} panel interviewer${invCount > 1 ? 's' : ''}.`
          : `Interview marked as finished! Candidate is ready for evaluation.`;
        this.finishSuccessToast.set(msg);
        setTimeout(() => this.finishSuccessToast.set(null), 6000);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to finish interview:', err);
        alert(err?.error?.detail || 'Failed to mark interview as finished. Please try again.');
      }
    });
  }

  resendInviteeEmail(email: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const item = this.selectedInterview();
    if (!item) return;

    this.isActionLoading.set(true);
    this.apiService.resendInviteeFeedback(item.jobId, item.id, email).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.decisionSuccess.set(`Feedback link and secret code resent to ${email}`);
        setTimeout(() => this.decisionSuccess.set(null), 4000);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.decisionError.set(err?.error?.detail || 'Failed to resend feedback email.');
      }
    });
  }

  applyPanelConsensus() {
    const consensus = this.panelConsensus();
    if (!consensus.hasGiven) return;

    this.rating.set(Math.round(consensus.avgRating) || 5);
    this.technicalScore.set(Math.round(consensus.avgTech) || 4);
    this.cultureScore.set(Math.round(consensus.avgCulture) || 4);
    this.communicationScore.set(Math.round(consensus.avgComm) || 4);

    const summaryLine = `[Panel Consensus (${consensus.givenCount} reviews)]: Overall ${consensus.avgRatingDisplay}/5, Tech ${consensus.avgTechDisplay}/5, Culture ${consensus.avgCultureDisplay}/5, Comm ${consensus.avgCommDisplay}/5`;
    const curNotes = this.internalNotes().trim();
    if (!curNotes.includes('[Panel Consensus')) {
      this.internalNotes.set(curNotes ? `${curNotes}\n\n${summaryLine}` : summaryLine);
    }

    this.decisionSuccess.set(`Calculated panel consensus applied to scorecard! (${consensus.givenCount} panel evaluations)`);
    setTimeout(() => this.decisionSuccess.set(null), 4000);
  }

  ngOnInit() {
    this.fetchOverview();
  }

  fetchOverview() {
    this.isLoading.set(true);
    this.apiService.getRecruiterInterviewsOverview().subscribe({
      next: (data) => {
        this.overviewData.set(data);
        // By default, expand all job groups
        const allIds = new Set<string>();
        data.groups.forEach(g => allIds.add(g.jobId));
        this.expandedJobs.set(allIds);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recruiter interviews:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Filtered Job Groups
  filteredGroups = computed(() => {
    const data = this.overviewData();
    if (!data) return [];

    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().slice(0, 10);

    return data.groups.map(group => {
      // Filter interviews inside group
      const matchingInterviews = group.interviews.filter(item => {
        // Text search
        const matchesQuery = !q || (
          item.candidateName.toLowerCase().includes(q) ||
          item.candidateEmail.toLowerCase().includes(q) ||
          item.jobTitle.toLowerCase().includes(q)
        );
        if (!matchesQuery) return false;

        const sched = item.interview?.scheduled_at;
        const outcome = item.interview?.outcome;
        const isPassed = outcome === 'Passed' || item.status === 'Interview Passed';
        const isFailed = outcome === 'Failed' || item.status === 'Rejected';

        // Tab filter
        if (filter === 'today_upcoming') {
          return !!sched && !isPassed && !isFailed && (sched >= nowIso || sched.startsWith(todayStr));
        }
        if (filter === 'needs_eval') {
          return !!sched && sched < nowIso && !isPassed && !isFailed;
        }
        if (filter === 'passed') {
          return isPassed;
        }
        if (filter === 'offers_drafting') {
          return item.offer?.status === 'Draft' || item.status === 'Offer Drafting';
        }
        if (filter === 'offers_extended') {
          return item.offer?.status === 'Offered' || item.status === 'Offer Extended' || item.status === 'Offered';
        }
        if (filter === 'offers_accepted') {
          return item.offer?.status === 'Accepted' || item.status === 'Contract Signed';
        }
        if (filter === 'failed') {
          return isFailed;
        }

        return true;
      });

      return {
        ...group,
        interviews: matchingInterviews
      };
    }).filter(group => group.interviews.length > 0 || !q && filter === 'all');
  });

  toggleJob(jobId: string) {
    this.expandedJobs.update(set => {
      const next = new Set(set);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }

  expandAll() {
    const data = this.overviewData();
    if (!data) return;
    const all = new Set<string>();
    data.groups.forEach(g => all.add(g.jobId));
    this.expandedJobs.set(all);
  }

  collapseAll() {
    this.expandedJobs.set(new Set());
  }

  // Open Drawer
  openEvaluationDrawer(item: ScheduledInterviewItem, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.selectedInterview.set(item);
    this.drawerStep.set('evaluation');

    // Pre-populate scorecard if already filled
    const res = item.interview?.result;
    if (res) {
      this.rating.set(res.rating || 5);
      this.technicalScore.set(res.technical_score || 4);
      this.cultureScore.set(res.culture_score || 4);
      this.communicationScore.set(res.communication_score || 4);
      this.internalNotes.set(res.internal_notes || '');
      this.candidateFeedback.set(res.candidate_feedback || '');
    } else {
      this.rating.set(5);
      this.technicalScore.set(4);
      this.cultureScore.set(4);
      this.communicationScore.set(4);
      this.internalNotes.set('');
      this.candidateFeedback.set('');
    }

    this.checkedProbes.set(new Set());
    this.decisionError.set(null);
    this.decisionSuccess.set(null);
    this.isDrawerOpen.set(true);
  }

  closeEvaluationDrawer() {
    this.isDrawerOpen.set(false);
    this.drawerStep.set('evaluation');
    this.selectedInterview.set(null);
    this.decisionError.set(null);
    this.decisionSuccess.set(null);
  }

  toggleProbe(probe: string) {
    this.checkedProbes.update(set => {
      const next = new Set(set);
      if (next.has(probe)) {
        next.delete(probe);
      } else {
        next.add(probe);
      }
      return next;
    });
  }

  // Save Notes Draft
  saveDraftNotes() {
    const item = this.selectedInterview();
    if (!item) return;

    this.isActionLoading.set(true);
    this.decisionError.set(null);
    this.decisionSuccess.set(null);

    const user = this.authService.recruiterUser();
    const payload: SaveInterviewNotesRequest = {
      result: {
        rating: this.rating(),
        technical_score: this.technicalScore(),
        culture_score: this.cultureScore(),
        communication_score: this.communicationScore(),
        internal_notes: this.internalNotes().trim() || undefined,
        candidate_feedback: this.candidateFeedback().trim() || undefined,
        evaluated_by: user?.workEmail || user?.email || undefined
      },
      recruiter_email: user?.workEmail || user?.email || undefined
    };

    this.apiService.saveInterviewNotes(item.jobId, item.id, payload).subscribe({
      next: (updatedMatch) => {
        this.isActionLoading.set(false);
        this.decisionSuccess.set('Interview notes & ratings saved successfully as draft.');
        this.updateLocalInterviewData(item.jobId, item.id, updatedMatch);
        setTimeout(() => this.decisionSuccess.set(null), 3000);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to save interview notes', err);
        this.decisionError.set(err?.error?.detail || 'Failed to save notes. Please try again.');
      }
    });
  }

  // Switch to in-drawer Confirmation Step
  openDecisionConfirmation(outcome: 'Passed' | 'Failed') {
    const item = this.selectedInterview();
    if (!item) return;

    if (outcome === 'Passed' && this.hasPendingPanelFeedback()) {
      this.decisionError.set(
        `Cannot pass interview until all interview panelist feedback is of state feedback given or declined/opt out (${this.pendingPanelistsCount()} pending).`
      );
      return;
    }

    this.pendingOutcome.set(outcome);
    this.decisionError.set(null);
    this.decisionSuccess.set(null);
    this.notifyCandidate.set(true);

    if (outcome === 'Passed') {
      this.customEmailMessage.set(
        `We are delighted with your interview performance! Our talent acquisition team will be reaching out within 24–48 hours to discuss the formal offer and compensation details.`
      );
    } else {
      this.customEmailMessage.set(
        this.candidateFeedback().trim() ||
        `Thank you for taking the time to interview with our team. While we have decided to proceed with other candidates whose experience aligns more specifically with this role, we greatly appreciated our conversation.`
      );
    }

    this.drawerStep.set('confirmation');
  }

  backToEvaluation() {
    this.drawerStep.set('evaluation');
    this.decisionError.set(null);
  }

  // Confirm Decision
  confirmDecision(advanceToOffer: boolean = false) {
    const item = this.selectedInterview();
    if (!item) return;

    if (this.pendingOutcome() === 'Passed' && this.hasPendingPanelFeedback()) {
      this.decisionError.set(
        `Cannot pass interview until all interview panelist feedback is of state feedback given or declined/opt out (${this.pendingPanelistsCount()} pending).`
      );
      return;
    }

    this.isActionLoading.set(true);
    this.decisionError.set(null);

    const user = this.authService.recruiterUser();
    const payload: InterviewDecisionRequest = {
      outcome: this.pendingOutcome(),
      result: {
        rating: this.rating(),
        technical_score: this.technicalScore(),
        culture_score: this.cultureScore(),
        communication_score: this.communicationScore(),
        internal_notes: this.internalNotes().trim() || undefined,
        candidate_feedback: this.candidateFeedback().trim() || undefined,
        evaluated_by: user?.workEmail || user?.email || undefined
      },
      notify_candidate: this.notifyCandidate(),
      custom_email_message: this.customEmailMessage().trim() || undefined,
      recruiter_email: user?.workEmail || user?.email || undefined
    };

    this.apiService.submitInterviewDecision(item.jobId, item.id, payload).subscribe({
      next: (updatedMatch) => {
        this.isActionLoading.set(false);
        this.updateLocalInterviewData(item.jobId, item.id, updatedMatch);
        this.closeEvaluationDrawer();
        this.fetchOverview(); // Refresh counts and groups

        if (advanceToOffer && payload.outcome === 'Passed') {
          const updatedItem: ScheduledInterviewItem = {
            ...item,
            status: updatedMatch.status || 'Interview Passed',
            interview: updatedMatch.interview || item.interview,
            offer: updatedMatch.offer || item.offer
          };
          this.openOfferDrawer(updatedItem);
        }
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to submit interview decision', err);
        this.decisionError.set(err?.error?.detail || err?.message || 'Failed to submit decision. Please try again.');
      }
    });
  }

  private updateLocalInterviewData(jobId: string, matchId: string, updatedDoc: any) {
    const data = this.overviewData();
    if (!data) return;

    const nextGroups = data.groups.map(group => {
      if (group.jobId !== jobId) return group;
      const nextInterviews = group.interviews.map(iv => {
        if (iv.id !== matchId) return iv;
        return {
          ...iv,
          status: updatedDoc.status || iv.status,
          interview: updatedDoc.interview || iv.interview,
          offer: updatedDoc.offer !== undefined ? updatedDoc.offer : iv.offer
        };
      });
      return {
        ...group,
        interviews: nextInterviews
      };
    });

    this.overviewData.set({
      ...data,
      groups: nextGroups
    });

    if (this.selectedInterview()?.id === matchId) {
      this.selectedInterview.set({
        ...this.selectedInterview()!,
        status: updatedDoc.status || this.selectedInterview()!.status,
        interview: updatedDoc.interview || this.selectedInterview()!.interview,
        offer: updatedDoc.offer !== undefined ? updatedDoc.offer : this.selectedInterview()!.offer
      });
    }

    if (this.offerInterview()?.id === matchId) {
      this.offerInterview.set({
        ...this.offerInterview()!,
        status: updatedDoc.status || this.offerInterview()!.status,
        interview: updatedDoc.interview || this.offerInterview()!.interview,
        offer: updatedDoc.offer !== undefined ? updatedDoc.offer : this.offerInterview()!.offer
      });
    }
  }

  // Display Helpers
  formatDisplayDate(dateStr?: string): string {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  formatDisplayTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    const today = new Date().toISOString().slice(0, 10);
    return dateStr.startsWith(today);
  }

  isPast(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  }

  getOutcomeInfo(item: ScheduledInterviewItem): { label: string; css: string; icon: string } {
    const offerStatus = item.offer?.status;
    if (offerStatus === 'Accepted' || item.status === 'Contract Signed') {
      return {
        label: 'Contract Signed',
        css: 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-extrabold',
        icon: '✓'
      };
    }
    if (offerStatus === 'Offered' || item.status === 'Offer Extended' || item.status === 'Offered') {
      return {
        label: 'Offer Extended',
        css: 'bg-[#244653] text-[#CBF1F5] border border-[#244653] font-bold',
        icon: 'extended_rec.svg'
      };
    }
    if (offerStatus === 'Draft' || item.status === 'Offer Drafting') {
      return {
        label: 'Offer Drafting',
        css: 'bg-[#E3FDFD] text-[#244653] border border-[#A6E3E9] font-bold',
        icon: '📝'
      };
    }
    if (offerStatus === 'Declined') {
      return {
        label: 'Offer Declined',
        css: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
        icon: '✕'
      };
    }

    const outcome = item.interview?.outcome;
    const status = item.status;

    if (outcome === 'Passed' || status === 'Interview Passed' || status === 'Passed') {
      return {
        label: 'Passed ✓',
        css: 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-bold',
        icon: '✓'
      };
    }
    if (outcome === 'Failed' || status === 'Rejected' || status === 'Interview Failed') {
      return {
        label: 'Unsuccessful',
        css: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
        icon: '✕'
      };
    }
    if (this.isInterviewFinished(item) && !outcome) {
      return {
        label: 'Finished (Ready for Eval)',
        css: 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-bold',
        icon: '✓'
      };
    }
    if (this.isPast(item.interview?.scheduled_at)) {
      return {
        label: 'Awaiting Results',
        css: 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A] font-bold animate-pulse',
        icon: 'feedback_rec.svg'
      };
    }
    if (this.isToday(item.interview?.scheduled_at)) {
      return {
        label: 'Today',
        css: 'bg-[#CBF1F5] text-[#244653] border border-[#71C9CE] font-bold',
        icon: '📅'
      };
    }
    return {
      label: 'Upcoming',
      css: 'bg-[#E3FDFD] text-[#244653] border border-[#A6E3E9]',
      icon: '🕒'
    };
  }

  getScoreColor(score?: number): string {
    if (score === undefined || score === null) return 'text-[#4E6770] bg-[#F8FBFA] border-[#D5EDED]';
    if (score >= 80) return 'text-[#244653] bg-[#CBF1F5] border-[#71C9CE] font-bold';
    if (score >= 65) return 'text-[#244653] bg-[#E3FDFD] border-[#A6E3E9] font-semibold';
    return 'text-[#854D0E] bg-[#FEF9C3] border-[#FEF08A] font-medium';
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // --- Contract Offer Actions ---
  canOfferContract(item?: ScheduledInterviewItem | null): boolean {
    if (!item) return false;
    if (item.offer) return true;
    const outcome = item.interview?.outcome;
    const status = item.status;
    return outcome === 'Passed' || status === 'Interview Passed' || status === 'Passed' ||
      status === 'Offer Drafting' || status === 'Offer Extended' || status === 'Offered' || status === 'Contract Signed';
  }

  openOfferDrawer(item: ScheduledInterviewItem, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.canOfferContract(item)) {
      alert('Contract offers can only be offered after the candidate has completed and passed the interview.');
      return;
    }
    // Cleanly close evaluation drawer to prevent backdrop overlay conflict
    if (this.isDrawerOpen()) {
      this.closeEvaluationDrawer();
    }

    this.offerInterview.set(item);
    this.isOfferDrawerOpen.set(true);
  }

  closeOfferDrawer() {
    this.isOfferDrawerOpen.set(false);
    this.offerInterview.set(null);
  }

  onOfferSaved(event: { match: any; isDraft: boolean }) {
    const item = this.offerInterview();
    if (item && event.match) {
      this.updateLocalInterviewData(item.jobId, item.id, event.match);
      this.fetchOverview();
    }
  }

  getCurrencySymbol(code: string): string {
    const found = this.popularCurrencies.find(c => c.code === (code || '').toUpperCase());
    return found ? found.symbol : (code || 'CHF');
  }

  formatCurrencyDisplay(val?: number, currencyCode: string = 'CHF'): string {
    if (val === undefined || val === null) return '-';
    const sym = this.getCurrencySymbol(currencyCode);
    return `${sym} ${val.toLocaleString()}`;
  }
}
