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
        const u = res?.user || {};
        const fullName = u.full_name || u.fullName || (this.email.includes('@') ? this.email.split('@')[0] : 'Candidate');
        this.authService.loginCandidate({
          ...u,
          email: u.email || this.email,
          firstName: u.first_name || u.firstName || (fullName.split(' ')[0]),
          lastName: u.last_name || u.lastName || (fullName.split(' ').slice(1).join(' ')),
          fullName: fullName,
          jobTitle: u.job_title || u.jobTitle || '',
          education: u.education || '',
          skills: u.skills || [],
          availableSkills: u.skills || [],
          experienceYears: u.experience_years ?? u.experienceYears ?? 3,
          workArrangement: u.work_arrangement || u.workArrangement || 'Remote Preferred',
          minSalary: u.min_salary || u.minSalary || '',
          initialAssessment: u.background || u.initialAssessment || null,
          hasSetupProfile: true,
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
