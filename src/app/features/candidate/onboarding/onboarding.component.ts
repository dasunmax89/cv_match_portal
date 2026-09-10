import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-candidate-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class Onboarding {
  private apiService = inject(ApiService);
  private router = inject(Router);

  currentStep = 1;
  isParsing = false;
  
  // Basic Details & Profile Data
  fullName = '';
  email = '';
  phone = '';
  jobTitle = '';
  experienceYears = 3;
  education = '';
  selectedSkills: string[] = [];
  availableSkills = ['TypeScript', 'Angular', 'React', 'Node.js', 'Python', 'FastAPI', 'Docker', 'AWS', 'SQL', 'GraphQL', 'MongoDB', 'PostgreSQL'];
  
  // Extracted AI History & Initial Assessment
  workHistory: any[] = [];
  initialAssessment: any = null;

  // Resume File
  fileName = '';
  uploadedFile: File | null = null;

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

      // Call getInitialAssessment to auto populate basic details, skills, education, work history & save to Cosmos DB
      this.apiService.getInitialAssessment(file).subscribe({
        next: (data) => {
          this.isParsing = false;
          if (data) {
            this.initialAssessment = data;
            
            // Auto populate basic details
            if (data.full_name && data.full_name !== 'Candidate') this.fullName = data.full_name;
            if (data.email) this.email = data.email;
            if (data.phone) this.phone = data.phone;
            if (data.suggested_title) this.jobTitle = data.suggested_title;
            if (data.experience_years) this.experienceYears = data.experience_years;
            if (data.education) this.education = data.education;

            // Auto populate skills
            if (data.skills && Array.isArray(data.skills)) {
              data.skills.forEach((s: string) => {
                if (!this.selectedSkills.includes(s)) this.selectedSkills.push(s);
                if (!this.availableSkills.includes(s)) this.availableSkills.push(s);
              });
            }

            // Auto populate work history
            if (data.work_history && Array.isArray(data.work_history)) {
              this.workHistory = data.work_history;
            }
          }
        },
        error: () => {
          this.isParsing = false;
        }
      });
    }
  }

  finishOnboarding() {
    const payload = {
      full_name: this.fullName || 'Candidate User',
      email: this.email || 'candidate@example.com',
      job_title: this.jobTitle || 'Fullstack Engineer',
      skills: this.selectedSkills,
      experience_years: this.experienceYears,
      work_arrangement: 'Remote Preferred'
    };

    this.apiService.candidateOnboarding(payload).subscribe({
      next: () => {
        this.router.navigate(['/candidate/dashboard']);
      },
      error: () => {
        this.router.navigate(['/candidate/dashboard']);
      }
    });
  }
}
