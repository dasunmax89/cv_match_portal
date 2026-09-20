import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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

  currentTab: 'details' | 'persona' | 'invites' = 'details';
  isSoloRecruiter = false;
  isSubmitting = false;

  fullName = '';
  recruiterEmail = '';
  phone = '';
  companyName = '';
  companyWebsite = '';
  accountType = 'solo';
  profileImage = '';
  companyLogo = '';

  // Persona & AI Rules
  recruiterRole = 'Technical Recruiter';
  industry = 'Technology & Software';
  companySize = '11-50 employees';
  hiringFocus = 'Engineering & Tech';
  aiSensitivity = 'Balanced (65%+)';

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

  // Team Invites
  teamInvites: TeamInvite[] = [
    { email: '', role: 'Hiring Manager', status: 'idle' }
  ];

  sentInvites: SentTeamInvite[] = [];
  isLoadingInvites = false;
  errorMessage = '';

  ngOnInit() {
    const user = this.authService.recruiterUser();
    if (user) {
      this.fullName = user.fullName || user.full_name || '';
      this.recruiterEmail = user.workEmail || user.work_email || user.email || '';
      this.phone = user.phone || '';
      this.companyName = user.companyName || user.company_name || user.fullName || 'Recruiter Workspace';
      this.companyWebsite = user.companyWebsite || user.company_website || '';
      this.industry = user.industry || 'Technology & Software';
      this.companySize = user.companySize || user.company_size || '11-50 employees';
      this.recruiterRole = user.recruiterRole || user.recruiter_role || 'Technical Recruiter';
      this.hiringFocus = user.hiringFocus || user.hiring_focus || 'Engineering & Tech';
      this.aiSensitivity = user.aiSensitivity || user.ai_sensitivity || 'Balanced (65%+)';
      this.profileImage = user.profileImage || user.profile_image || '';
      this.companyLogo = user.companyLogo || user.company_logo || '';
      this.accountType = user.accountType || user.account_type || (user.companyName ? 'company' : 'solo');
      this.isSoloRecruiter = (this.accountType === 'solo');
      if (!this.isSoloRecruiter) {
        this.loadSentInvites();
      }
    }
  }

  onProfileImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, JPEG, WEBP).';
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
          } else {
            this.profileImage = e.target.result;
          }
        } catch {
          this.profileImage = e.target.result;
        }
      };
      img.onerror = () => {
        this.errorMessage = 'Failed to process selected image file.';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage() {
    this.profileImage = '';
  }

  onCompanyLogoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file for company logo (PNG, JPG, JPEG, WEBP).';
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
            this.companyLogo = canvas.toDataURL('image/png', 0.9);
          } else {
            this.companyLogo = e.target.result;
          }
        } catch {
          this.companyLogo = e.target.result;
        }
      };
      img.onerror = () => {
        this.errorMessage = 'Failed to process selected company logo.';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeCompanyLogo() {
    this.companyLogo = '';
  }

  loadSentInvites() {
    const user = this.authService.recruiterUser() || {};
    const companyId = user.id || user.company_id || user.companyId;
    if (!companyId) return;

    this.isLoadingInvites = true;
    this.apiService.getTeamInvites(companyId).subscribe({
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
    if (tab === 'invites' && this.isSoloRecruiter) {
      return; // Hide invites tab for solo recruiter
    }
    this.currentTab = tab;
    if (tab === 'invites' && !this.isSoloRecruiter) {
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
    if (!invite.email || !invite.email.trim()) {
      invite.status = 'error';
      invite.errorMessage = 'Please enter a valid email address.';
      return;
    }

    invite.status = 'sending';
    invite.errorMessage = '';

    const user = this.authService.recruiterUser() || {};
    const companyId = user.id || user.company_id || user.companyId || 'COMP-DEFAULT';
    const companyName = this.companyName || user.companyName || 'Recruiter Workspace';

    this.apiService.inviteRecruiterTeam({
      emails: [invite.email.trim()],
      company_id: companyId,
      company_name: companyName
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

  finishOnboarding(action: 'create-jd' | 'dashboard') {
    this.isSubmitting = true;
    this.errorMessage = '';

    const validInvites = this.isSoloRecruiter ? [] : this.teamInvites.filter(i => i.email && i.email.trim());

    const payload = {
      company_name: this.companyName || 'Recruiter Workspace',
      company_website: this.companyWebsite || '',
      company_size: this.companySize || (this.isSoloRecruiter ? 'Solo Recruiter' : '11-50 employees'),
      industry: this.industry || 'Recruitment & Staffing',
      recruiter_email: this.recruiterEmail,
      recruiter_role: this.recruiterRole,
      hiring_focus: this.hiringFocus,
      ai_sensitivity: this.aiSensitivity,
      profile_image: this.profileImage,
      company_logo: this.companyLogo,
      team_invites: validInvites
    };

    this.apiService.recruiterOnboarding(payload).subscribe({
      next: (res) => {
        const currentUser = this.authService.recruiterUser() || {};
        const companyId = res?.id || currentUser.id || currentUser.company_id || 'COMP-DEFAULT';
        const companyName = res?.company_name || payload.company_name;

        // Collect unsent team invite emails
        const unsentEmails = this.isSoloRecruiter
          ? []
          : this.teamInvites
              .filter(i => i.email && i.email.trim() && i.status !== 'sent')
              .map(i => i.email.trim());

        const completeAuthAndNavigate = () => {
          this.isSubmitting = false;
          this.authService.loginRecruiter({
            ...currentUser,
            fullName: this.fullName || currentUser.fullName || currentUser.full_name,
            workEmail: payload.recruiter_email,
            phone: this.phone,
            companyName: payload.company_name,
            companyWebsite: payload.company_website,
            companySize: payload.company_size,
            industry: payload.industry,
            recruiterRole: payload.recruiter_role,
            hiringFocus: payload.hiring_focus,
            aiSensitivity: payload.ai_sensitivity,
            profileImage: this.profileImage,
            profile_image: this.profileImage,
            companyLogo: this.companyLogo,
            company_logo: this.companyLogo,
            hasCompletedOnboarding: true
          });

          if (action === 'create-jd') {
            this.router.navigate(['/recruiter/create']);
          } else {
            this.router.navigate(['/recruiter/jobs']);
          }
        };

        if (unsentEmails.length > 0) {
          this.apiService.inviteRecruiterTeam({
            emails: unsentEmails,
            company_id: companyId,
            company_name: companyName
          }).subscribe({
            next: () => {
              this.teamInvites.forEach(i => {
                if (unsentEmails.includes(i.email.trim())) {
                  i.status = 'sent';
                }
              });
              completeAuthAndNavigate();
            },
            error: () => {
              completeAuthAndNavigate();
            }
          });
        } else {
          completeAuthAndNavigate();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Failed to save workspace configuration. Please try again.';
      }
    });
  }
}
