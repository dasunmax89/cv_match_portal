import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Profile Basic Information
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  jobTitle = '';
  experienceYears = 3;
  education = '';

  // Technical Skills State
  selectedSkills: string[] = [];
  availableSkills: string[] = [];
  newSkillInput = '';

  // Work Experience History State
  workHistory: any[] = [];

  // Job Preferences State
  workArrangement = 'Remote Preferred';
  minSalary = '$120,000 / year';

  // AI Initial Assessment Summary
  initialAssessment: any = null;

  // Active Tab & Feedback State
  activeTab: 'personal' | 'skills' | 'preferences' = 'personal';
  isSubmitting = false;
  errorMessage = '';
  saveSuccessMessage = '';

  ngOnInit() {
    const user = this.authService.candidateUser();
    if (user) {
      if (user.email) this.email = user.email;
      if (user.firstName) this.firstName = user.firstName;
      if (user.lastName) this.lastName = user.lastName;
      if (!this.firstName && user.fullName) {
        const parts = user.fullName.split(' ');
        this.firstName = parts[0] || '';
        this.lastName = parts.slice(1).join(' ') || '';
      }
      if (user.jobTitle) this.jobTitle = user.jobTitle;
      if (user.education) this.education = user.education;
      if (user.experienceYears) this.experienceYears = user.experienceYears;
      if (user.workArrangement) this.workArrangement = user.workArrangement;
      if (user.minSalary) this.minSalary = user.minSalary;

      if (user.skills && Array.isArray(user.skills)) {
        this.selectedSkills = [...user.skills];
        this.availableSkills = user.availableSkills?.length ? [...user.availableSkills] : [...user.skills];
      }
      if (user.workHistory && Array.isArray(user.workHistory)) {
        this.workHistory = [...user.workHistory];
      }
      if (user.initialAssessment) {
        this.initialAssessment = user.initialAssessment;
      }
    } else {
      this.router.navigate(['/candidate/onboarding']);
    }
  }

  selectTab(tab: 'personal' | 'skills' | 'preferences') {
    this.activeTab = tab;
    this.errorMessage = '';
    this.saveSuccessMessage = '';
  }

  addCustomSkill() {
    const val = this.newSkillInput.trim();
    if (val && !this.selectedSkills.includes(val)) {
      this.selectedSkills.push(val);
      if (!this.availableSkills.includes(val)) {
        this.availableSkills.push(val);
      }
      this.newSkillInput = '';
    }
  }

  removeSkill(skill: string) {
    this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
  }

  toggleSkill(skill: string) {
    if (this.selectedSkills.includes(skill)) {
      this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  addWorkHistoryItem() {
    this.workHistory.push({
      title: '',
      company: '',
      duration: '',
      summary: ''
    });
  }

  removeWorkHistoryItem(index: number) {
    this.workHistory.splice(index, 1);
  }

  reuploadCv() {
    this.router.navigate(['/candidate/onboarding']);
  }

  exploreJobs() {
    this.router.navigate(['/candidate/dashboard']);
  }

  saveProfileChanges() {
    if (!this.email || !this.firstName) {
      this.errorMessage = 'First Name and Email Address are required.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.saveSuccessMessage = '';

    const fullName = `${this.firstName} ${this.lastName}`.trim();
    const payload = {
      first_name: this.firstName,
      last_name: this.lastName,
      full_name: fullName,
      email: this.email,
      job_title: this.jobTitle,
      education: this.education,
      skills: this.selectedSkills,
      experience_years: this.experienceYears,
      work_arrangement: this.workArrangement,
      min_salary: this.minSalary,
      background: this.initialAssessment
    };

    this.apiService.updateCandidateProfile(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.saveSuccessMessage = 'Candidate Profile updated successfully!';
        this.authService.loginCandidate({
          email: payload.email,
          firstName: payload.first_name,
          lastName: payload.last_name,
          fullName: payload.full_name,
          jobTitle: payload.job_title,
          education: payload.education,
          experienceYears: payload.experience_years,
          skills: payload.skills,
          availableSkills: this.availableSkills,
          workHistory: this.workHistory,
          workArrangement: this.workArrangement,
          minSalary: this.minSalary,
          hasSetupProfile: true,
          initialAssessment: this.initialAssessment
        });

        setTimeout(() => {
          this.saveSuccessMessage = '';
        }, 3500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Failed to update candidate profile.';
      }
    });
  }
}
