import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-recruiter-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class Onboarding {
  private apiService = inject(ApiService);
  private router = inject(Router);

  currentStep = 1;

  // Company Details
  companyName = '';
  companyWebsite = '';
  companySize = '50-200 employees';
  industry = 'Software & Technology';

  // Team Invite
  teamEmails = '';

  nextStep() {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  finishOnboarding() {
    const payload = {
      company_name: this.companyName || 'Acme Corporation',
      company_website: this.companyWebsite || 'https://acme.com',
      company_size: this.companySize,
      industry: this.industry,
      recruiter_email: 'recruiter@company.com'
    };

    this.apiService.recruiterOnboarding(payload).subscribe({
      next: () => {
        if (this.teamEmails.trim()) {
          const emails = this.teamEmails.split(',').map(e => e.trim()).filter(e => e);
          if (emails.length > 0) {
            this.apiService.inviteRecruiterTeam(emails).subscribe();
          }
        }
        this.router.navigate(['/recruiter/jobs']);
      },
      error: () => {
        this.router.navigate(['/recruiter/jobs']);
      }
    });
  }
}
