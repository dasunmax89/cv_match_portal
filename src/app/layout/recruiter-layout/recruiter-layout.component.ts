import { Component, inject, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-recruiter-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './recruiter-layout.component.html',
  styleUrl: './recruiter-layout.component.css',
})
export class RecruiterLayout implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isDropdownOpen = false;
  isRedirectingToPayrexx = false;

  ngOnInit() {
    this.refreshSubscription();
  }

  refreshSubscription() {
    const user = this.authService.recruiterUser();
    if (!user) return;
    const email = user.workEmail || user.work_email || user.email || '';
    const userId = user.id || email;
    this.apiService.getSubscriptionStatus(email, userId).subscribe({
      next: (sub) => {
        if (sub) {
          this.authService.updateRecruiterSubscription(sub);
        }
      },
      error: (err) => console.log('Notice refreshing subscription status:', err)
    });
  }

  openPayrexxPayment() {
    const user = this.authService.recruiterUser();
    if (!user) return;
    const email = user.workEmail || user.work_email || user.email || '';
    const userId = user.id || email;
    const companyId = user.companyId || user.company_id;

    this.isRedirectingToPayrexx = true;
    this.apiService.createSubscriptionPaylink(email, userId, companyId).subscribe({
      next: (res) => {
        this.isRedirectingToPayrexx = false;
        const payUrl = res?.payment_url || res?.paylink;
        if (payUrl) {
          window.location.href = payUrl;
        } else {
          this.router.navigate(['/recruiter/profile']);
        }
      },
      error: (err) => {
        this.isRedirectingToPayrexx = false;
        console.error('Failed to create Payrexx payment link:', err);
        this.router.navigate(['/recruiter/profile']);
      }
    });
  }

  get isTrial(): boolean {
    return this.authService.isTrial();
  }

  get isPaymentDone(): boolean {
    return this.authService.isPaymentDone();
  }

  get isTrialExpired(): boolean {
    return this.authService.isTrialExpired();
  }

  get trialDaysRemaining(): number {
    return this.authService.trialDaysRemaining();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  navigateTo(path: string) {
    this.closeDropdown();
    this.router.navigate([path]);
  }

  logout() {
    this.closeDropdown();
    this.authService.logoutRecruiter();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  get initials(): string {
    const user = this.authService.recruiterUser();
    if (!user) return 'RW';
    const name = user.companyName || user.company_name || user.fullName || user.full_name || user.workEmail || user.work_email || 'Recruiter';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
