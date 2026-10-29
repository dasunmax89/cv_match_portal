import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  inviteId: string | null = null;
  paymentType: 'invite' | 'subscription' = 'invite';
  userId: string | null = null;
  email: string | null = null;
  paymentRef: string | null = null;

  isConfirming = false;
  confirmationDone = false;
  errorMessage: string | null = null;

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.inviteId = params.get('invite_id');
    const typeParam = params.get('type');
    this.userId = params.get('user_id');
    this.email = params.get('email');
    this.paymentRef = params.get('ref');

    if (typeParam === 'subscription' || (!this.inviteId && (this.userId || this.email))) {
      this.paymentType = 'subscription';
      this.confirmSubscription();
    } else if (this.inviteId) {
      this.paymentType = 'invite';
      this.confirmInvite();
    } else {
      this.confirmationDone = true;
    }
  }

  private confirmSubscription() {
    const user = this.authService.recruiterUser() || {};
    const targetEmail = this.email || user.workEmail || user.email || '';
    const targetId = this.userId || user.id || targetEmail;

    this.isConfirming = true;
    this.errorMessage = null;

    this.apiService.confirmSubscriptionPayment(targetEmail, targetId, this.paymentRef || undefined).subscribe({
      next: (res) => {
        this.isConfirming = false;
        this.confirmationDone = true;
        if (res?.subscription) {
          this.authService.updateRecruiterSubscription(res.subscription);
        }
        console.log('[PAYMENT SUCCESS] Confirmed Recruiter Pro subscription:', res);
      },
      error: (err) => {
        this.isConfirming = false;
        this.errorMessage = 'Could not confirm subscription automatically, but your transaction has been logged.';
        console.error('[PAYMENT SUCCESS] Error confirming subscription:', err);
      }
    });
  }

  private confirmInvite() {
    if (!this.inviteId) return;
    this.isConfirming = true;
    this.apiService.confirmInvitePayment(this.inviteId).subscribe({
      next: (res) => {
        this.isConfirming = false;
        this.confirmationDone = true;
        console.log('[PAYMENT SUCCESS] Confirmed invite payment:', res);
      },
      error: (err) => {
        this.isConfirming = false;
        console.error('[PAYMENT SUCCESS] Error confirming invite payment:', err);
      }
    });
  }
}
