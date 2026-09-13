import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-recruiter-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  companyName = '';
  workEmail = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onSubmit() {
    if (!this.workEmail || !this.password || !this.companyName) {
      this.errorMessage = 'Please fill in all fields (Company Name, Work Email, and Password).';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.signup(this.workEmail, this.password, this.companyName).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.authService.loginRecruiter({
          workEmail: this.workEmail,
          companyName: this.companyName,
          token: res?.access_token
        });
        this.router.navigate(['/recruiter/onboarding']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Registration failed. Please check your information.';
      }
    });
  }
}
