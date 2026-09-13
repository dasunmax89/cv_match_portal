import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-candidate-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both your email address and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const name = this.email.includes('@') ? this.email.split('@')[0] : 'Candidate';

    this.apiService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.authService.loginCandidate({
          email: this.email,
          fullName: name,
          token: res?.access_token
        });
        this.router.navigate(['/candidate/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Login failed. Please check your email and credentials.';
      }
    });
  }
}
