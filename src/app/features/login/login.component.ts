import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);

  email = 'admin@example.com';
  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  onSubmit(): void {
    if (!this.email) {
      this.errorMessage.set('EMAIL_LABEL');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.apiService.login(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.access_token) {
          localStorage.setItem('portal_token', res.access_token);
          localStorage.setItem('portal_refresh_token', res.access_token);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('LOGIN_FAILED');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.detail || 'LOGIN_FAILED');
      }
    });
  }
}

