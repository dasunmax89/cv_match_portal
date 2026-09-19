import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AutoGrowDirective } from '../../../shared/directives/auto-grow.directive';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AutoGrowDirective],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Profile Basic Information
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  jobTitle = '';
  experienceYears = 3;
  education = '';
  profileImage = '';

  // Technical Skills State
  selectedSkills: string[] = [];
  availableSkills: string[] = [];
  newSkillInput = '';
  suggestedMasterSkills: any[] = [];
  private skillSearchSubject = new Subject<string>();

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
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'preferences' || params['tab'] === 'skills' || params['tab'] === 'personal') {
        this.activeTab = params['tab'];
      }
    });

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
      if (user.profileImage || user.profile_image) {
        this.profileImage = user.profileImage || user.profile_image;
      }

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

    this.skillSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim().length > 0) {
        this.apiService.searchMasterSkills(query).subscribe({
          next: (res) => {
            this.suggestedMasterSkills = res;
          },
          error: (err) => {
            console.error('Error fetching skills taxonomy', err);
            this.suggestedMasterSkills = [];
          }
        });
      } else {
        this.suggestedMasterSkills = [];
      }
    });
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
      this.suggestedMasterSkills = [];
    }
  }

  onSkillInputChanged() {
    this.skillSearchSubject.next(this.newSkillInput);
  }

  selectSuggestedSkill(skill: any) {
    this.newSkillInput = skill.name;
    this.addCustomSkill();
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

  // Re-upload CV Modal & AI Analysis State
  showCvUploadModal = false;
  isParsingCv = false;
  uploadFileName = '';
  cvUploadError = '';
  cvUploadSuccess = '';

  reuploadCv() {
    this.showCvUploadModal = true;
    this.uploadFileName = '';
    this.cvUploadError = '';
    this.cvUploadSuccess = '';
    this.isParsingCv = false;
  }

  closeCvModal() {
    this.showCvUploadModal = false;
    this.cvUploadError = '';
    this.cvUploadSuccess = '';
  }

  onCvFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadFileName = file.name;
    this.isParsingCv = true;
    this.cvUploadError = '';
    this.cvUploadSuccess = '';

    this.apiService.getInitialAssessment(file).subscribe({
      next: (data) => {
        this.isParsingCv = false;
        if (data) {
          this.applyParsedCvData(data);
          this.cvUploadSuccess = 'CV re-analyzed by AI successfully! Profile updated.';
        }
      },
      error: () => {
        // Fallback to parseCandidateCv endpoint
        this.apiService.parseCandidateCv(file).subscribe({
          next: (data) => {
            this.isParsingCv = false;
            if (data) {
              this.applyParsedCvData(data);
              this.cvUploadSuccess = 'CV parsed successfully! Profile updated.';
            }
          },
          error: (parseErr) => {
            this.isParsingCv = false;
            this.cvUploadError = parseErr?.error?.detail || 'Failed to analyze CV. Please try again.';
          }
        });
      }
    });
  }

  private applyParsedCvData(data: any) {
    this.initialAssessment = data;
    if (data.first_name) this.firstName = data.first_name;
    if (data.last_name) this.lastName = data.last_name;
    if ((!this.firstName || !this.lastName) && data.full_name && data.full_name !== 'Candidate') {
      const parts = data.full_name.trim().split(' ');
      if (!this.firstName) this.firstName = parts[0] || '';
      if (!this.lastName) this.lastName = parts.slice(1).join(' ') || '';
    }
    if (data.email) this.email = data.email;
    if (data.phone) this.phone = data.phone;
    if (data.suggested_title) this.jobTitle = data.suggested_title;
    if (data.experience_years) this.experienceYears = data.experience_years;
    if (data.education) this.education = data.education;

    const skills = data.skills || data.extracted_skills || [];
    if (skills.length) {
      this.availableSkills = [...skills];
      this.selectedSkills = [...skills];
    }
    if (data.work_history && Array.isArray(data.work_history)) {
      this.workHistory = data.work_history;
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
      workHistory: this.workHistory,
      hasSetupProfile: true,
      initialAssessment: this.initialAssessment
    });
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
            // Compress canvas to compact JPEG data URL (~30KB-50KB)
            this.profileImage = canvas.toDataURL('image/jpeg', 0.82);
            this.saveSuccessMessage = 'Profile photo preview updated! Save changes below to persist.';
            setTimeout(() => {
              if (this.saveSuccessMessage.includes('preview')) {
                this.saveSuccessMessage = '';
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
        this.errorMessage = 'Failed to process selected image file.';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage() {
    this.profileImage = '';
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

    // Ensure initialAssessment.skills is updated with selectedSkills if initialAssessment exists
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

    // Keep availableSkills synced with selectedSkills
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
      profile_image: this.profileImage,
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

        this.profileImage = res.profile_image || payload.profile_image || '';

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
          profileImage: this.profileImage,
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
