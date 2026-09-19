import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-failed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-failed.component.html'
})
export class PaymentFailedComponent implements OnInit {
  private route = inject(ActivatedRoute);
  inviteId: string | null = null;

  ngOnInit() {
    this.inviteId = this.route.snapshot.queryParamMap.get('invite_id');
  }
}
