import { Component, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CandidateMatch } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-candidate-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-review.component.html',
  styleUrls: ['./candidate-review.component.css']
})
export class CandidateReviewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public apiService = inject(ApiService);
  private signalRService = inject(SignalRService);

  jobId = signal<string>('');
  candidates = signal<CandidateMatch[]>([]);
  currentIndex = signal<number>(0);
  viewMode = signal<'stack' | 'table'>('stack');
  
  // Animation states for the top card
  swipeDirection = signal<'left' | 'right' | null>(null);

  constructor() {
    // Listen for real-time candidates
    effect(() => {
      const newCandidate = this.signalRService.candidateEvaluated();
      if (newCandidate && newCandidate.jobId === this.jobId()) {
        // Prepend new candidate to the stack
        this.candidates.update(list => [newCandidate, ...list]);
        // Reset animation states if needed
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId.set(id);
      this.loadCandidates();
      this.signalRService.joinJobGroup(id);
    }
  }

  ngOnDestroy() {
    if (this.jobId()) {
      this.signalRService.leaveJobGroup(this.jobId());
    }
  }

  private loadCandidates() {
    this.apiService.getJobMatches(this.jobId()).subscribe({
      next: (data) => {
        const sorted = data.sort((a, b) => {
          const scoreA = a.evaluation?.overall_match_score ?? -1;
          const scoreB = b.evaluation?.overall_match_score ?? -1;
          return scoreB - scoreA;
        });
        this.candidates.set(sorted);
      },
      error: (err) => console.error('Failed to load candidates', err)
    });
  }

  get currentCandidate(): CandidateMatch | undefined {
    return this.candidates()[this.currentIndex()];
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

  reject() {
    if (!this.currentCandidate) return;
    this.swipeDirection.set('left');
    this.apiService.updateMatchStatus(this.jobId(), this.currentCandidate.id, 'Rejected').subscribe({
      next: (updatedMatch) => console.log('Rejected', updatedMatch),
      error: (err) => console.error('Reject failed', err)
    });
    setTimeout(() => this.nextCard(), 300);
  }

  shortlist() {
    if (!this.currentCandidate) return;
    this.swipeDirection.set('right');
    this.apiService.updateMatchStatus(this.jobId(), this.currentCandidate.id, 'Shortlisted').subscribe({
      next: (updatedMatch) => console.log('Shortlisted', updatedMatch),
      error: (err) => console.error('Shortlist failed', err)
    });
    setTimeout(() => this.nextCard(), 300);
  }

  private nextCard() {
    this.swipeDirection.set(null);
    this.candidates.update(list => {
      const newList = [...list];
      newList.splice(this.currentIndex(), 1);
      return newList;
    });
    // currentIndex stays 0 because we removed the top one
  }
}
