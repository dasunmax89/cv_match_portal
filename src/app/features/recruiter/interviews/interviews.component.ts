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
  SaveInterviewNotesRequest
} from '../../../core/models/candidate.models';

@Component({
  selector: 'app-recruiter-interviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './interviews.component.html'
})
export class RecruiterInterviewsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  activeFilter = signal<'all' | 'today_upcoming' | 'needs_eval' | 'passed' | 'failed'>('all');

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
  confirmDecision() {
    const item = this.selectedInterview();
    if (!item) return;

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
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to submit interview decision', err);
        this.decisionError.set(err?.error?.detail || 'Failed to submit decision. Please try again.');
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
          interview: updatedDoc.interview || iv.interview
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
        interview: updatedDoc.interview || this.selectedInterview()!.interview
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
    const outcome = item.interview?.outcome;
    const status = item.status;

    if (outcome === 'Passed' || status === 'Interview Passed') {
      return {
        label: 'Passed ✓',
        css: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        icon: '✓'
      };
    }
    if (outcome === 'Failed' || status === 'Rejected') {
      return {
        label: 'Unsuccessful',
        css: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
        icon: '✕'
      };
    }
    if (this.isPast(item.interview?.scheduled_at)) {
      return {
        label: 'Awaiting Results',
        css: 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse',
        icon: '⏳'
      };
    }
    if (this.isToday(item.interview?.scheduled_at)) {
      return {
        label: 'Today',
        css: 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
        icon: '📅'
      };
    }
    return {
      label: 'Upcoming',
      css: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: '🕒'
    };
  }

  getScoreColor(score?: number): string {
    if (score === undefined || score === null) return 'text-slate-600 bg-slate-100 border-slate-200';
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold';
    if (score >= 65) return 'text-sky-700 bg-sky-50 border-sky-200 font-semibold';
    return 'text-amber-700 bg-amber-50 border-amber-200 font-medium';
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
