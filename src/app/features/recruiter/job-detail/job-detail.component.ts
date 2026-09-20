import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { JobResponse } from '../../../core/models/candidate.models';
import { SjtComposeComponent } from '../sjt-compose/sjt-compose.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SjtComposeComponent],
  templateUrl: './job-detail.component.html'
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  jobId = signal<string | null>(null);
  job = signal<JobResponse | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  isSjtComposeOpen = signal<boolean>(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId.set(id);
      this.loadJob(id);
    } else {
      this.error.set('No job ID provided');
      this.isLoading.set(false);
    }
  }

  loadJob(id: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.apiService.getRecruiterJob(id).subscribe({
      next: (data) => {
        this.job.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load job details:', err);
        this.error.set('Failed to load job details. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/recruiter/jobs']);
  }

  evaluateCandidates() {
    const id = this.jobId();
    if (id) {
      this.router.navigate(['/recruiter/jobs', id]);
    }
  }

  openSjtCompose() {
    this.isSjtComposeOpen.set(true);
  }

  closeSjtCompose() {
    this.isSjtComposeOpen.set(false);
  }

  onSjtSaved(updatedAssessment: any) {
    const currentJob = this.job();
    if (currentJob) {
      this.job.set({ ...currentJob, assessment: updatedAssessment });
    }
    this.isSjtComposeOpen.set(false);
  }
}
