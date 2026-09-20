import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export interface TeamInvite {
  email: string;
  role: 'Recruiter' | 'Hiring Manager' | 'Admin';
  status?: 'idle' | 'sending' | 'sent' | 'error';
  errorMessage?: string;
}

export interface SentTeamInvite {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: string;
  status: 'PendingPayment' | 'Completed' | string;
  createdAt: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-profile.component.html'
})
export class CompanyProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentTab = signal<'details' | 'persona' | 'invites'>('details');
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Tab 1: Personal & Company Details
  fullName = '';
  workEmail = '';
  phone = '';
  recruiterRole = 'Technical Recruiter';
  companyName = '';
  companyWebsite = '';
  industry = 'Technology & Software';
  companySize = '11-50 employees';
  location = 'San Francisco, CA';
  profileImage = '';

  // Tab 2: Persona & AI Rules
  hiringFocus = 'Engineering & Tech';
  aiSensitivity = 'Balanced (65%+)';
  customAiInstructions = '';

  roleOptions = [
    'Technical Recruiter',
    'Talent Acquisition Lead',
    'Hiring Manager',
    'Founder / Executive',
    'HR Generalist'
  ];

  industryOptions = [
    'Technology & Software',
    'Finance & Fintech',
    'Healthcare & Biotech',
    'E-commerce & Retail',
    'Consulting & Professional Services',
    'Recruitment & Staffing',
    'Other'
  ];

  sizeOptions = [
    'Solo Recruiter (1)',
    '2-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  focusOptions = [
    'Engineering & Tech',
    'Sales & Business Development',
    'Product & Design',
    'Operations & HR',
    'All Departments'
  ];

  sensitivityOptions = [
    { label: 'Strict (80%+ match)', desc: 'Only highlight top tier candidates with exact skill overlaps' },
    { label: 'Balanced (65%+ match)', desc: 'Optimal blend of hard skills, experience & growth potential (Recommended)' },
    { label: 'Flexible (50%+ match)', desc: 'Broad filter to view wider candidate pools & transferable skills' }
  ];

  // Tab 3: Team Invites
  teamInvites: TeamInvite[] = [
    { email: '', role: 'Hiring Manager', status: 'idle' }
  ];
  sentInvites: SentTeamInvite[] = [];
  isLoadingInvites = false;

  ngOnInit() {
    this.loadUserData();
    this.loadSentInvites();
  }

  loadUserData() {
    const user = this.authService.recruiterUser();
    if (user) {
      this.fullName = user.fullName || user.full_name || '';
      this.workEmail = user.workEmail || user.work_email || user.email || '';
      this.phone = user.phone || '';
      this.recruiterRole = user.recruiterRole || user.recruiter_role || 'Technical Recruiter';
      this.companyName = user.companyName || user.company_name || 'Recruiter Workspace';
      this.companyWebsite = user.companyWebsite || user.company_website || '';
      this.industry = user.industry || 'Technology & Software';
      this.companySize = user.companySize || user.company_size || '11-50 employees';
      this.location = user.location || '';
      this.hiringFocus = user.hiringFocus || user.hiring_focus || 'Engineering & Tech';
      this.aiSensitivity = user.aiSensitivity || user.ai_sensitivity || 'Balanced (65%+)';
      this.customAiInstructions = user.customAiInstructions || '';
      this.profileImage = user.profileImage || user.profile_image || '';
    }
  }

  onProfileImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            this.profileImage = canvas.toDataURL('image/jpeg', 0.82);
            this.successMessage.set('Profile photo preview updated! Save changes to persist.');
            setTimeout(() => {
              if (this.successMessage()?.includes('preview')) {
                this.successMessage.set(null);
              }
            }, 4000);
          } else {
            this.profileImage = e.target.result;
          }
        } catch {
          this.profileImage = e.target.result;
        }
      };
      img.onerror = () => {
        this.errorMessage.set('Failed to process selected image file.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage() {
    this.profileImage = '';
  }

  loadSentInvites() {
    const user = this.authService.recruiterUser() || {};
    const companyId = user.id || user.company_id || user.companyId || '';
    const recruiterEmail = this.workEmail || user.workEmail || user.work_email || user.email || '';

    this.isLoadingInvites = true;
    this.apiService.getTeamInvites(companyId, recruiterEmail).subscribe({
      next: (invites) => {
        this.sentInvites = invites || [];
        this.isLoadingInvites = false;
      },
      error: () => {
        this.isLoadingInvites = false;
      }
    });
  }

  setTab(tab: 'details' | 'persona' | 'invites') {
    this.currentTab.set(tab);
    if (tab === 'invites') {
      this.loadSentInvites();
    }
  }

  addInviteRow() {
    this.teamInvites.push({ email: '', role: 'Recruiter', status: 'idle' });
  }

  removeInviteRow(index: number) {
    if (this.teamInvites.length > 1) {
      this.teamInvites.splice(index, 1);
    } else {
      this.teamInvites[0] = { email: '', role: 'Recruiter', status: 'idle' };
    }
  }

  sendSingleInvite(invite: TeamInvite) {
    const emailClean = invite.email ? invite.email.trim().toLowerCase() : '';
    if (!emailClean) {
      invite.status = 'error';
      invite.errorMessage = 'Please enter a valid email address.';
      return;
    }

    const user = this.authService.recruiterUser() || {};
    const myEmail = (this.workEmail || user.workEmail || user.work_email || user.email || '').toLowerCase();
    if (emailClean === myEmail) {
      invite.status = 'error';
      invite.errorMessage = 'You cannot send an invitation to your own email address.';
      return;
    }

    const alreadySent = this.sentInvites.find(i => (i.email || '').toLowerCase() === emailClean);
    if (alreadySent) {
      invite.status = 'error';
      invite.errorMessage = alreadySent.status === 'Completed' 
        ? `An invitation to ${emailClean} has already been accepted.`
        : `An invitation to ${emailClean} is already pending payment.`;
      return;
    }

    invite.status = 'sending';
    invite.errorMessage = '';

    const companyId = user.id || user.company_id || user.companyId || 'COMP-DEFAULT';
    const companyName = this.companyName || user.companyName || 'Recruiter Workspace';
    const recruiterEmail = this.workEmail || user.workEmail || user.work_email || user.email || '';

    this.apiService.inviteRecruiterTeam({
      emails: [emailClean],
      company_id: companyId,
      company_name: companyName,
      recruiter_email: recruiterEmail
    }).subscribe({
      next: () => {
        invite.status = 'sent';
        invite.errorMessage = '';
        this.loadSentInvites();
      },
      error: (err) => {
        invite.status = 'error';
        invite.errorMessage = err?.error?.detail || err?.message || 'Failed to send invite.';
      }
    });
  }

  saveProfile() {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const currentUser = this.authService.recruiterUser() || {};

    const payload = {
      company_name: this.companyName,
      company_website: this.companyWebsite,
      company_size: this.companySize,
      industry: this.industry,
      recruiter_email: this.workEmail,
      recruiter_role: this.recruiterRole,
      hiring_focus: this.hiringFocus,
      ai_sensitivity: this.aiSensitivity,
      profile_image: this.profileImage
    };

    this.apiService.recruiterOnboarding(payload).subscribe({
      next: (res) => {
        const updatedUser = {
          ...currentUser,
          fullName: this.fullName,
          workEmail: this.workEmail,
          phone: this.phone,
          companyName: this.companyName,
          companyWebsite: this.companyWebsite,
          companySize: this.companySize,
          industry: this.industry,
          location: this.location,
          recruiterRole: this.recruiterRole,
          hiringFocus: this.hiringFocus,
          aiSensitivity: this.aiSensitivity,
          customAiInstructions: this.customAiInstructions,
          profileImage: this.profileImage,
          profile_image: this.profileImage
        };

        this.authService.loginRecruiter(updatedUser);
        this.isSubmitting.set(false);
        this.successMessage.set('Company & profile details saved successfully!');
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.detail || err?.message || 'Failed to update company profile.');
      }
    });
  }
}
