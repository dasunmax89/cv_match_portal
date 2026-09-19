import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-candidate-onboarding',
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
  isParsing = false;
  
  // Basic Details & Profile Data
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  jobTitle = '';
  experienceYears = 3;
  education = '';
  selectedSkills: string[] = [];
  availableSkills: string[] = [];
  
  // Extracted AI History & Initial Assessment
  workHistory: any[] = [];
  initialAssessment: any = null;

  // Resume File
  fileName = '';
  uploadedFile: File | null = null;

  // Error, submission & profile tab state
  errorMessage = '';
  saveSuccessMessage = '';
  isSubmitting = false;
  activeTab: 'personal' | 'skills' | 'preferences' = 'personal';

  // Job Preferences Data
  workArrangement = 'Remote Preferred';
  minSalary = '$120,000 / year';
  newSkillInput = '';

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

  saveProfileChanges() {
    if (!this.email || !this.firstName) {
      this.errorMessage = 'First Name and Email Address are required.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.saveSuccessMessage = '';

    const fullName = `${this.firstName} ${this.lastName}`.trim();

    if (this.initialAssessment) {
      this.initialAssessment = {
        ...this.initialAssessment,
        skills: [...this.selectedSkills],
        first_name: this.firstName,
        last_name: this.lastName,
        full_name: fullName,
        suggested_title: this.jobTitle,
        experience_years: this.experienceYears,
        education: this.education
      };
    }

    this.availableSkills = Array.from(new Set([...this.availableSkills, ...this.selectedSkills]));

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
      next: (res: any) => {
        this.isSubmitting = false;
        this.saveSuccessMessage = 'Candidate Profile updated successfully!';

        const updatedSkills = res.skills || payload.skills;
        this.selectedSkills = [...updatedSkills];
        this.availableSkills = Array.from(new Set([...this.availableSkills, ...updatedSkills]));
        if (res.background) {
          this.initialAssessment = res.background;
        }

        this.authService.loginCandidate({
          ...this.authService.candidateUser(),
          email: res.email || payload.email,
          firstName: res.first_name || payload.first_name,
          lastName: res.last_name || payload.last_name,
          fullName: res.full_name || payload.full_name,
          jobTitle: res.job_title || payload.job_title,
          education: payload.education,
          experienceYears: res.experience_years ?? payload.experience_years,
          skills: updatedSkills,
          availableSkills: this.availableSkills,
          workHistory: this.workHistory,
          workArrangement: res.work_arrangement || payload.work_arrangement,
          minSalary: payload.min_salary,
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

      if (this.authService.hasCandidateProfile()) {
        this.currentStep = 3;
      }
    }
  }

  editProfile() {
    this.currentStep = 1;
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

  toggleSkill(skill: string) {
    if (this.selectedSkills.includes(skill)) {
      this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.uploadedFile = file;
      this.isParsing = true;
      this.errorMessage = '';

      // Call getInitialAssessment to auto populate basic details, skills, education, work history & save to Cosmos DB
      this.apiService.getInitialAssessment(file).subscribe({
        next: (data) => {
          this.isParsing = false;
          if (data) {
            this.initialAssessment = data;
            
            // Auto populate First Name, Last Name & Email
            if (data.first_name) this.firstName = data.first_name;
            if (data.last_name) this.lastName = data.last_name;
            if ((!this.firstName || !this.lastName) && data.full_name && data.full_name !== 'Candidate') {
              const parts = data.full_name.trim().split(' ');
              if (!this.firstName) this.firstName = parts[0] || '';
              if (!this.lastName) this.lastName = parts.slice(1).join(' ') || '';
            }
            if (data.email) this.email = data.email;
            if (data.phone) this.phone = data.phone;

            // Auto populate Target Job Title & Education Background
            if (data.suggested_title) this.jobTitle = data.suggested_title;
            if (data.experience_years) this.experienceYears = data.experience_years;
            if (data.education) this.education = data.education;

            // Auto populate AI Extracted Key Skills feed
            if (data.skills && Array.isArray(data.skills)) {
              this.availableSkills = [...data.skills];
              this.selectedSkills = [...data.skills];
            }

            // Auto populate work history
            if (data.work_history && Array.isArray(data.work_history)) {
              this.workHistory = data.work_history;
            }

            // Save candidate state locally as initial assessment completed
            this.authService.loginCandidate({
              ...this.authService.candidateUser(),
              email: this.email,
              firstName: this.firstName,
              lastName: this.lastName,
              fullName: `${this.firstName} ${this.lastName}`.trim(),
              jobTitle: this.jobTitle,
              education: this.education,
              experienceYears: this.experienceYears,
              skills: this.selectedSkills,
              availableSkills: this.availableSkills,
              workHistory: this.workHistory,
              hasSetupProfile: true,
              initialAssessment: this.initialAssessment
            });
          }
        },
        error: (err) => {
          this.apiService.parseCandidateCv(file).subscribe({
            next: (data) => {
              this.isParsing = false;
              if (data) {
                if (data.first_name) this.firstName = data.first_name;
                if (data.last_name) this.lastName = data.last_name;
                if ((!this.firstName || !this.lastName) && data.full_name) {
                  const parts = data.full_name.trim().split(' ');
                  if (!this.firstName) this.firstName = parts[0] || '';
                  if (!this.lastName) this.lastName = parts.slice(1).join(' ') || '';
                }
                if (data.email) this.email = data.email;
                if (data.suggested_title) this.jobTitle = data.suggested_title;
                if (data.education) this.education = data.education;
                const skills = data.skills || data.extracted_skills || [];
                if (skills.length) {
                  this.availableSkills = [...skills];
                  this.selectedSkills = [...skills];
                }
                this.authService.loginCandidate({
                  ...this.authService.candidateUser(),
                  email: this.email,
                  firstName: this.firstName,
                  lastName: this.lastName,
                  fullName: `${this.firstName} ${this.lastName}`.trim(),
                  jobTitle: this.jobTitle,
                  education: this.education,
                  experienceYears: this.experienceYears,
                  skills: this.selectedSkills,
                  availableSkills: this.availableSkills,
                  hasSetupProfile: true
                });
              }
            },
            error: (parseErr) => {
              this.isParsing = false;
              this.errorMessage = parseErr?.error?.detail || err?.error?.detail || 'Failed to parse resume CV. Please enter your profile details manually.';
            }
          });
        }
      });
    }
  }

  finishOnboarding() {
    if (!this.email || !this.firstName) {
      this.errorMessage = 'Please complete your First Name and Email Address before submitting.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const fullName = `${this.firstName} ${this.lastName}`.trim();

    if (this.initialAssessment) {
      this.initialAssessment = {
        ...this.initialAssessment,
        skills: [...this.selectedSkills],
        first_name: this.firstName,
        last_name: this.lastName,
        full_name: fullName,
        suggested_title: this.jobTitle,
        experience_years: this.experienceYears,
        education: this.education
      };
    }

    this.availableSkills = Array.from(new Set([...this.availableSkills, ...this.selectedSkills]));

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

    this.apiService.candidateOnboarding(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const updatedSkills = res?.skills || payload.skills;
        if (res?.background) {
          this.initialAssessment = res.background;
        }

        this.authService.loginCandidate({
          ...this.authService.candidateUser(),
          email: res?.email || payload.email,
          firstName: res?.first_name || payload.first_name,
          lastName: res?.last_name || payload.last_name,
          fullName: res?.full_name || payload.full_name,
          jobTitle: res?.job_title || payload.job_title,
          education: payload.education,
          experienceYears: res?.experience_years ?? payload.experience_years,
          skills: updatedSkills,
          availableSkills: this.availableSkills,
          workHistory: this.workHistory,
          workArrangement: res?.work_arrangement || payload.work_arrangement,
          minSalary: payload.min_salary,
          hasSetupProfile: true,
          initialAssessment: this.initialAssessment
        });
        this.router.navigate(['/candidate/profile']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Failed to complete profile onboarding. Please check your inputs and try again.';
      }
    });
  }
}
