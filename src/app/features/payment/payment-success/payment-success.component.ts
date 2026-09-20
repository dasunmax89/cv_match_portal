import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  inviteId: string | null = null;
  isConfirming = false;
  confirmationDone = false;

  ngOnInit() {
    this.inviteId = this.route.snapshot.queryParamMap.get('invite_id');
    if (this.inviteId) {
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
}
