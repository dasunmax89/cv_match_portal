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

  currentTab: 'persona' | 'invites' = 'persona';
  isSoloRecruiter = false;
  isSubmitting = false;

  recruiterEmail = '';
  companyName = '';
  accountType = 'solo';

  // Persona & AI Rules
  recruiterRole = 'Technical Recruiter';
  hiringFocus = 'Engineering & Tech';
  aiSensitivity = 'Balanced (65%+)';

  roleOptions = [
    'Technical Recruiter',
    'Talent Acquisition Lead',
    'Hiring Manager',
    'Founder / Executive',
    'HR Generalist'
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

  ngOnInit() {
    const user = this.authService.recruiterUser();
    if (user) {
      this.recruiterEmail = user.workEmail || user.email || '';
      this.companyName = user.companyName || user.fullName || 'Recruiter Workspace';
      this.accountType = user.accountType || user.account_type || (user.companyName ? 'company' : 'solo');
      this.isSoloRecruiter = (this.accountType === 'solo');
      if (!this.isSoloRecruiter) {
        this.loadSentInvites();
      }
    }
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

  setTab(tab: 'persona' | 'invites') {
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


  errorMessage = '';

  finishOnboarding(action: 'create-jd' | 'dashboard') {
    this.isSubmitting = true;
    this.errorMessage = '';

    const validInvites = this.isSoloRecruiter ? [] : this.teamInvites.filter(i => i.email && i.email.trim());

    const payload = {
      company_name: this.companyName || 'Recruiter Workspace',
      company_website: '',
      company_size: this.isSoloRecruiter ? 'Solo Recruiter' : '11-50 employees',
      industry: 'Recruitment & Staffing',
      recruiter_email: this.recruiterEmail,
      recruiter_role: this.recruiterRole,
      hiring_focus: this.hiringFocus,
      ai_sensitivity: this.aiSensitivity,
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
            workEmail: payload.recruiter_email,
            companyName: payload.company_name,
            recruiterRole: payload.recruiter_role,
            aiSensitivity: payload.ai_sensitivity,
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
