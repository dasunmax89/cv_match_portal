import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';

@Component({
  selector: 'app-recruiter-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);

  workEmail = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onGoogleSignIn() {
    this.isLoading = true;
    this.errorMessage = '';
    this.googleAuthService.signInWithPopup('recruiter')
      .then(authRes => {
        const obs = authRes.credential
          ? this.apiService.loginWithGoogle(authRes.credential, 'recruiter')
          : this.apiService.loginWithGoogle('', 'recruiter', authRes.accessToken);

        obs.subscribe({
          next: (res) => {
            this.isLoading = false;
            const userData = res?.user || {};
            const subscriptionInfo = res?.subscription || userData?.subscription;
            this.authService.loginRecruiter({
              ...userData,
              workEmail: userData.email || userData.recruiter_email,
              companyName: userData.company_name || 'Organization',
              aiSensitivity: userData.ai_sensitivity || userData.aiSensitivity || 'Balanced (65%+)',
              subscription: subscriptionInfo,
              token: res?.access_token
            });
            this.router.navigate(['/recruiter/jobs']);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err?.error?.detail || err?.message || 'Recruiter Google login failed. Please try again.';
          }
        });
      })
      .catch(err => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Google sign-in was cancelled or encountered an error.';
      });
  }

  onSubmit() {
    if (!this.workEmail || !this.password) {
      this.errorMessage = 'Please enter both your work email address and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.login(this.workEmail, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        const userData = res?.user || {};
        const subscriptionInfo = res?.subscription || userData?.subscription;
        this.authService.loginRecruiter({
          ...userData,
          workEmail: userData.email || userData.recruiter_email || this.workEmail,
          companyName: userData.company_name || this.workEmail.split('@')[1]?.split('.')[0] || 'Company',
          aiSensitivity: userData.ai_sensitivity || userData.aiSensitivity || 'Balanced (65%+)',
          subscription: subscriptionInfo,
          token: res?.access_token
        });
        this.router.navigate(['/recruiter/jobs']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Recruiter login failed. Please check your credentials.';
      }
    });
  }
}
