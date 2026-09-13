import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface TeamInvite {
  email: string;
  role: 'Recruiter' | 'Hiring Manager' | 'Admin';
}

@Component({
  selector: 'app-recruiter-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class Onboarding implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentStep = 1;
  isSubmitting = false;

  // Step 1: Company & Domain
  recruiterEmail = '';
  companyName = '';
  companyWebsite = '';
  companySize = '50-200 employees';
  industry = 'Software & Technology';
  isPublicEmail = false;

  // Step 2: Persona & AI Rules
  recruiterRole = 'Technical Recruiter';
  hiringFocus = 'Engineering & Tech';
  aiSensitivity = 'Balanced (65%+)';

  // Role Options
  roleOptions = [
    'Technical Recruiter',
    'Talent Acquisition Lead',
    'Hiring Manager',
    'Founder / Executive',
    'HR Generalist'
  ];

  // Focus Options
  focusOptions = [
    'Engineering & Tech',
    'Sales & Business Development',
    'Product & Design',
    'Operations & HR',
    'All Departments'
  ];

  // AI Sensitivity Options
  sensitivityOptions = [
    { label: 'Strict (80%+ match)', desc: 'Only highlight top tier candidates with exact skill overlaps' },
    { label: 'Balanced (65%+ match)', desc: 'Optimal blend of hard skills, experience & growth potential (Recommended)' },
    { label: 'Flexible (50%+ match)', desc: 'Broad filter to view wider candidate pools & transferable skills' }
  ];

  // Step 3: Team Invites
  teamInvites: TeamInvite[] = [
    { email: '', role: 'Hiring Manager' }
  ];

  ngOnInit() {
    const user = this.authService.recruiterUser();
    if (user) {
      if (user.workEmail) {
        this.recruiterEmail = user.workEmail;
        this.onEmailChange();
      }
      if (user.companyName) {
        this.companyName = user.companyName;
      }
    }
  }

  onEmailChange() {
    if (!this.recruiterEmail) return;
    const parts = this.recruiterEmail.split('@');
    if (parts.length === 2) {
      const domain = parts[1].toLowerCase().trim();
      const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
      this.isPublicEmail = publicDomains.includes(domain);
      
      if (!this.isPublicEmail && !this.companyWebsite && domain.includes('.')) {
        this.companyWebsite = `https://${domain}`;
      }
      if (!this.companyName && !this.isPublicEmail && domain.includes('.')) {
        const namePart = domain.split('.')[0];
        this.companyName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      }
    }
  }

  addInviteRow() {
    this.teamInvites.push({ email: '', role: 'Recruiter' });
  }

  removeInviteRow(index: number) {
    if (this.teamInvites.length > 1) {
      this.teamInvites.splice(index, 1);
    } else {
      this.teamInvites[0] = { email: '', role: 'Recruiter' };
    }
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  errorMessage = '';

  finishOnboarding(action: 'create-jd' | 'dashboard') {
    if (!this.companyName || !this.recruiterEmail) {
      this.errorMessage = 'Please complete your Company Name and Work Email before finishing onboarding.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const validInvites = this.teamInvites.filter(i => i.email && i.email.trim());

    const payload = {
      company_name: this.companyName,
      company_website: this.companyWebsite,
      company_size: this.companySize,
      industry: this.industry,
      recruiter_email: this.recruiterEmail,
      recruiter_role: this.recruiterRole,
      hiring_focus: this.hiringFocus,
      ai_sensitivity: this.aiSensitivity,
      team_invites: validInvites
    };

    this.apiService.recruiterOnboarding(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.authService.loginRecruiter({
          workEmail: payload.recruiter_email,
          companyName: payload.company_name,
          recruiterRole: payload.recruiter_role,
          aiSensitivity: payload.ai_sensitivity
        });
        if (action === 'create-jd') {
          this.router.navigate(['/recruiter/create']);
        } else {
          this.router.navigate(['/recruiter/jobs']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Failed to save recruiter workspace details. Please check inputs and try again.';
      }
    });
  }
}
