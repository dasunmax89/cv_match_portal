import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

export type ResetStep = 'email' | 'otp' | 'success';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  role: 'recruiter' | 'candidate' = 'candidate';
  step: ResetStep = 'email';

  // Form Fields
  email = '';
  otpCode = '';
  newPassword = '';
  confirmPassword = '';

  // UI state
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  infoMessage = '';

  // Resend cooldown timer
  resendCooldown = 0;
  private timerInterval: any = null;

  ngOnInit() {
    // Detect role from route data or URL path
    const routeRole = this.route.snapshot.data['role'];
    const currentUrl = this.router.url;

    if (routeRole === 'recruiter' || currentUrl.includes('/recruiter/')) {
      this.role = 'recruiter';
    } else {
      this.role = 'candidate';
    }

    // Pre-fill email if passed in queryParams
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    if (queryEmail) {
      this.email = queryEmail.trim();
    }
  }

  ngOnDestroy() {
    this.clearCooldownTimer();
  }

  get loginRoute(): string {
    return this.role === 'recruiter' ? '/recruiter/login' : '/candidate/login';
  }

  get portalName(): string {
    return this.role === 'recruiter' ? 'Recruiter Workspace' : 'Candidate Portal';
  }

  get isPasswordLongEnough(): boolean {
    return (this.newPassword || '').length >= 8;
  }

  get doPasswordsMatch(): boolean {
    return !!this.newPassword && this.newPassword === this.confirmPassword;
  }

  get canSubmitReset(): boolean {
    return (
      (this.otpCode || '').trim().length === 6 &&
      this.isPasswordLongEnough &&
      this.doPasswordsMatch &&
      !this.isLoading
    );
  }

  // --- Step 1: Request OTP ---
  onRequestOtp() {
    this.errorMessage = '';
    this.infoMessage = '';

    const cleanEmail = (this.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.apiService.requestPasswordReset(cleanEmail, this.role).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.step = 'otp';
        this.infoMessage = `A 6-digit verification code has been sent to ${cleanEmail}.`;
        this.startCooldownTimer(60);
        // Pre-fill test code for dev convenience if present
        if (res?.otp_code) {
          this.otpCode = res.otp_code;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.detail ||
          err?.message ||
          'Failed to send verification code. Please check your email address.';
      }
    });
  }

  // --- Step 2: Resend OTP ---
  onResendOtp() {
    if (this.resendCooldown > 0 || this.isLoading) return;

    this.errorMessage = '';
    this.infoMessage = '';
    const cleanEmail = (this.email || '').trim().toLowerCase();

    this.isLoading = true;
    this.apiService.resendPasswordResetOtp(cleanEmail, this.role).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.infoMessage = `A fresh verification code has been dispatched to ${cleanEmail}.`;
        this.startCooldownTimer(60);
        if (res?.otp_code) {
          this.otpCode = res.otp_code;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.detail || err?.message || 'Failed to resend code. Please try again.';
      }
    });
  }

  // --- Step 3: Verify OTP & Reset Password ---
  onResetPassword() {
    this.errorMessage = '';
    this.infoMessage = '';

    const cleanEmail = (this.email || '').trim().toLowerCase();
    const cleanOtp = (this.otpCode || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code from your email.';
      return;
    }

    if (!this.isPasswordLongEnough) {
      this.errorMessage = 'New password must be at least 8 characters long.';
      return;
    }

    if (!this.doPasswordsMatch) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.apiService.resetPassword({
      email: cleanEmail,
      code: cleanOtp,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.step = 'success';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.detail ||
          err?.message ||
          'Password reset failed. Please ensure your verification code is valid.';
      }
    });
  }

  // Navigation helpers
  backToEmail() {
    this.step = 'email';
    this.errorMessage = '';
    this.infoMessage = '';
    this.otpCode = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.clearCooldownTimer();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private startCooldownTimer(seconds: number) {
    this.clearCooldownTimer();
    this.resendCooldown = seconds;
    this.timerInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.clearCooldownTimer();
      }
    }, 1000);
  }

  private clearCooldownTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.resendCooldown = 0;
  }
}
