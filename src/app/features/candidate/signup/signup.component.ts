import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-candidate-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onSubmit() {
    if (!this.email || !this.password || !this.fullName) {
      this.errorMessage = 'Please fill in all fields (Full Name, Email, and Password).';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.signup(this.email, this.password, this.fullName).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.authService.loginCandidate({
          email: this.email,
          fullName: this.fullName,
          token: res?.access_token
        });
        this.router.navigate(['/candidate/onboarding']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Registration failed. Please check your information.';
      }
    });
  }
}
