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
  startWithNewQuestion = signal<boolean>(false);
  isDeletingQuestion = signal<number | null>(null);
  sjtActionError = signal<string | null>(null);

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

  openSjtCompose(withNewQuestion: boolean = false) {
    this.startWithNewQuestion.set(withNewQuestion);
    this.isSjtComposeOpen.set(true);
  }

  closeSjtCompose() {
    this.isSjtComposeOpen.set(false);
    this.startWithNewQuestion.set(false);
  }

  deleteQuestion(index: number) {
    const currentJob = this.job();
    if (!currentJob || !currentJob.assessment || !currentJob.assessment.questions) return;

    const confirmed = window.confirm(`Are you sure you want to remove question Q${index + 1}?`);
    if (!confirmed) return;

    this.isDeletingQuestion.set(index);
    this.sjtActionError.set(null);

    const updatedQuestions = currentJob.assessment.questions.filter((_, i) => i !== index);
    const updatedAssessment = {
      ...currentJob.assessment,
      questions: updatedQuestions
    };

    this.apiService.updateJobSjt(currentJob.id, updatedAssessment).subscribe({
      next: (savedAssessment) => {
        this.job.set({
          ...currentJob,
          assessment: savedAssessment
        });
        this.isDeletingQuestion.set(null);
      },
      error: (err) => {
        console.error('Failed to delete question:', err);
        this.sjtActionError.set(err.error?.detail || 'Failed to remove question. Please try again.');
        this.isDeletingQuestion.set(null);
      }
    });
  }

  onSjtSaved(updatedAssessment: any) {
    const currentJob = this.job();
    if (currentJob) {
      this.job.set({ ...currentJob, assessment: updatedAssessment });
    }
    this.isSjtComposeOpen.set(false);
    this.startWithNewQuestion.set(false);
  }
}
