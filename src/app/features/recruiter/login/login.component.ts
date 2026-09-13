import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

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
  private router = inject(Router);

  workEmail = '';
  password = '';
  errorMessage = '';
  isLoading = false;

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
        this.authService.loginRecruiter({
          workEmail: this.workEmail,
          companyName: this.workEmail.split('@')[1]?.split('.')[0] || 'Company',
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
