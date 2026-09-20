import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { JobResponse } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-recruiter-job-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './job-list.component.html'
})
export class RecruiterJobListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  jobs = signal<JobResponse[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.isLoading.set(true);
    this.apiService.getRecruiterJobs().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recruiter jobs:', err);
        this.isLoading.set(false);
      }
    });
  }

  get filteredJobs(): JobResponse[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.jobs();
    return this.jobs().filter(j => 
      j.title.toLowerCase().includes(q) ||
      j.criteria?.title?.toLowerCase().includes(q) ||
      j.criteria?.required_skills?.some(s => s.toLowerCase().includes(q))
    );
  }

  openJobDetails(job: JobResponse) {
    this.router.navigate(['/recruiter/jobs', job.id, 'details']);
  }

  viewJobDetails(job: JobResponse, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/recruiter/jobs', job.id, 'details']);
  }

  openCandidateDeck(job: JobResponse, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/recruiter/jobs', job.id]);
  }

  createNewJob() {
    this.router.navigate(['/recruiter/create']);
  }

  hasBehavioralCheck(job: JobResponse): boolean {
    return !!(job.assessment && job.assessment.questions && job.assessment.questions.length > 0);
  }
}
