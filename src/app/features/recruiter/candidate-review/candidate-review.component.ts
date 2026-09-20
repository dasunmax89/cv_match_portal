import { Component, effect, HostListener, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CandidateMatch, JobResponse } from '../../../core/models/candidate.models';
@Component({
  selector: 'app-candidate-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-review.component.html',
  styleUrls: ['./candidate-review.component.css']
})
export class CandidateReviewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public apiService = inject(ApiService);
  private signalRService = inject(SignalRService);

  jobId = signal<string>('');
  jobDetails = signal<JobResponse | null>(null);
  candidates = signal<CandidateMatch[]>([]);
  currentIndex = signal<number>(0);
  viewMode = signal<'stack' | 'table'>('stack');
  selectedTableCandidate = signal<CandidateMatch | null>(null);
  
  isLoading = signal<boolean>(true);
  swipeDirection = signal<'left' | 'right' | null>(null);

  constructor() {
    // Listen for real-time candidates
    effect(() => {
      const newCandidate = this.signalRService.candidateEvaluated();
      if (newCandidate && newCandidate.jobId === this.jobId()) {
        // Prepend new candidate to the stack
        this.candidates.update(list => [newCandidate, ...list]);
      }
    }, { allowSignalWrites: true });
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
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId.set(id);
      this.loadJobDetails(id);
      this.loadCandidates();
      this.signalRService.joinJobGroup(id);
    } else {
      this.isLoading.set(false);
    }
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

  ngOnDestroy() {
    if (this.jobId()) {
      this.signalRService.leaveJobGroup(this.jobId());
    }
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
  
  getVerdictBadgeClass(verdict: string | undefined): string {
    if (!verdict || verdict === 'Pending') return 'bg-slate-100 text-slate-600 border-slate-200';
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
    this.swipeDirection.set('left');
    this.apiService.updateMatchStatus(this.jobId(), target.id, 'Rejected').subscribe({
      next: (updatedMatch) => {
        this.candidates.update(list => list.map(c => c.id === target.id ? { ...c, status: 'Rejected' } : c));
        if (this.selectedTableCandidate()?.id === target.id) {
          this.selectedTableCandidate.update(c => c ? { ...c, status: 'Rejected' } : null);
        }
      },
      error: (err) => console.error('Reject failed', err)
    });
    setTimeout(() => {
      this.swipeDirection.set(null);
      if (!candidate && this.currentIndex() < this.candidates().length - 1) {
        this.nextCard();
      }
    }, 300);
  }

  shortlist(candidate?: CandidateMatch) {
    const target = candidate || this.currentCandidate;
    if (!target) return;
    this.swipeDirection.set('right');
    this.apiService.updateMatchStatus(this.jobId(), target.id, 'Shortlisted').subscribe({
      next: (updatedMatch) => {
        this.candidates.update(list => list.map(c => c.id === target.id ? { ...c, status: 'Shortlisted' } : c));
        if (this.selectedTableCandidate()?.id === target.id) {
          this.selectedTableCandidate.update(c => c ? { ...c, status: 'Shortlisted' } : null);
        }
      },
      error: (err) => console.error('Shortlist failed', err)
    });
    setTimeout(() => {
      this.swipeDirection.set(null);
      if (!candidate && this.currentIndex() < this.candidates().length - 1) {
        this.nextCard();
      }
    }, 300);
  }

  openCandidateDetails(candidate: CandidateMatch) {
    this.selectedTableCandidate.set(candidate);
  }

  closeCandidateDetails() {
    this.selectedTableCandidate.set(null);
  }

  getCandidateSelectedKey(candidate: CandidateMatch, questionId: string): string | null {
    if (!candidate.candidate_answers) return null;
    const ans = candidate.candidate_answers.find(a => a.question_id === questionId);
    return ans ? ans.selected_key : null;
  }
}

