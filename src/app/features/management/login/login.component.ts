import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';

@Component({
  selector: 'app-management-login',
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

  adminId = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onGoogleSignIn() {
    this.isLoading = true;
    this.errorMessage = '';
    this.googleAuthService.signInWithPopup('management')
      .then(authRes => {
        const obs = authRes.credential
          ? this.apiService.loginWithGoogle(authRes.credential, 'management')
          : this.apiService.loginWithGoogle('', 'management', authRes.accessToken);

        obs.subscribe({
          next: (res) => {
            this.isLoading = false;
            const u = res?.user || {};
            this.authService.loginManagement({
              ...u,
              adminId: u.email || this.adminId || 'Admin',
              token: res?.access_token
            });
            this.router.navigate(['/management/dashboard']);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err?.error?.detail || err?.message || 'Management Google login failed. Please verify admin privileges.';
          }
        });
      })
      .catch(err => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Google sign-in was cancelled or encountered an error.';
      });
  }

  onSubmit() {
    if (!this.adminId || !this.password) {
      this.errorMessage = 'Please enter both your Admin ID and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.login(this.adminId, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.authService.loginManagement({
          adminId: this.adminId,
          token: res?.access_token
        });
        this.router.navigate(['/management/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Admin authentication failed. Please check your credentials.';
      }
    });
  }
}
