import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { InviteeFeedbackInfoResponse, SubmitInviteeFeedbackPayload } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-invitee-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './interview-feedback.component.html'
})
export class InviteeFeedbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  token = signal<string>('');
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  feedbackInfo = signal<InviteeFeedbackInfoResponse | null>(null);

  // Authentication Step
  secretCode = signal<string>('');
  authError = signal<string | null>(null);
  isAuthenticated = signal<boolean>(false);

  // Evaluation Form State
  rating = signal<number>(5);
  technicalScore = signal<number>(4);
  cultureScore = signal<number>(4);
  communicationScore = signal<number>(4);
  internalNotes = signal<string>('');
  candidateFeedback = signal<string>('');

  // Submission Status
  isSubmitted = signal<boolean>(false);
  isOptedOut = signal<boolean>(false);
  submitSuccess = signal<string | null>(null);
  submitError = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tok = params['token'] || '';
      this.token.set(tok);
      if (!tok) {
        this.isLoading.set(false);
        this.errorMessage.set('Missing feedback verification token. Please click the link sent in your invitation email.');
        return;
      }
      this.loadFeedbackInfo(tok);
    });
  }

  loadFeedbackInfo(tok: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.apiService.getInviteeFeedbackInfo(tok).subscribe({
      next: (info) => {
        this.feedbackInfo.set(info);
        this.isLoading.set(false);
        if (info.status === 'given') {
          this.isSubmitted.set(true);
          if (info.evaluation) {
            this.rating.set(info.evaluation.rating || 5);
            this.technicalScore.set(info.evaluation.technical_score || 4);
            this.cultureScore.set(info.evaluation.culture_score || 4);
            this.communicationScore.set(info.evaluation.communication_score || 4);
            this.internalNotes.set(info.evaluation.internal_notes || '');
            this.candidateFeedback.set(info.evaluation.candidate_feedback || '');
          }
        } else if (info.status === 'not opt in') {
          this.isOptedOut.set(true);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load feedback details:', err);
        this.errorMessage.set(err?.error?.detail || 'Invalid or expired feedback link. Please check your email invitation.');
      }
    });
  }

  verifyCode() {
    const code = this.secretCode().trim();
    if (!code) {
      this.authError.set('Please enter the 6-character secret authentication code.');
      return;
    }
    this.isActionLoading.set(true);
    this.authError.set(null);

    this.apiService.verifyInviteeCode(this.token(), code).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        this.isAuthenticated.set(true);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.authError.set(err?.error?.detail || 'Invalid secret authentication code. Please check the code sent to your email.');
      }
    });
  }

  submitEvaluation() {
    const code = this.secretCode().trim();
    if (!code) {
      this.submitError.set('Authentication code is missing. Please re-authenticate.');
      return;
    }

    this.isActionLoading.set(true);
    this.submitError.set(null);

    const payload: SubmitInviteeFeedbackPayload = {
      secret_code: code,
      rating: this.rating(),
      technical_score: this.technicalScore(),
      culture_score: this.cultureScore(),
      communication_score: this.communicationScore(),
      internal_notes: this.internalNotes().trim() || undefined,
      candidate_feedback: this.candidateFeedback().trim() || undefined
    };

    this.apiService.submitInviteeFeedback(this.token(), payload).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        this.isSubmitted.set(true);
        this.submitSuccess.set('Your interview evaluation has been recorded and submitted to the hiring team.');
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.submitError.set(err?.error?.detail || 'Failed to submit evaluation. Please check your network and try again.');
      }
    });
  }

  optOut() {
    if (!confirm('Are you sure you want to decline or opt out of evaluating this candidate?')) {
      return;
    }
    this.isActionLoading.set(true);
    this.apiService.optOutInviteeFeedback(this.token(), this.secretCode().trim() || undefined).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.isOptedOut.set(true);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.submitError.set(err?.error?.detail || 'Failed to update status.');
      }
    });
  }

  getRatingLabel(r: number): string {
    if (r >= 5) return '5 / 5 (Strong Recommendation)';
    if (r === 4) return '4 / 5 (Strong Recommendation)';
    if (r === 3) return '3 / 5 (Average Fit)';
    if (r === 2) return '2 / 5 (Needs Improvement)';
    return '1 / 5 (Not Recommended)';
  }

  formatDisplayDate(dateStr?: string): string {
    if (!dateStr) return 'Completed Interview';
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
}

