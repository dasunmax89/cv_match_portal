import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { JobResponse } from '../../core/models/candidate.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  jobs = signal<JobResponse[]>([]);
  loading = signal<boolean>(true);
  totalCandidates = signal<number>(0);
  avgMatchScore = signal<number>(0);
  searchTerm = signal<string>('');

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.loading.set(true);
    this.apiService.getRecruiterJobs().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.loading.set(false);
        this.calculateCandidateStats(data);
      },
      error: (err) => {
        console.error('Failed to load recruiter jobs', err);
        this.loading.set(false);
      }
    });
  }

  private calculateCandidateStats(jobsList: JobResponse[]) {
    let candidateCount = 0;
    let totalScoreSum = 0;
    let scoreCount = 0;

    jobsList.forEach(job => {
      this.apiService.getJobMatches(job.id).subscribe({
        next: (matches) => {
          candidateCount += matches.length;
          matches.forEach(m => {
            if (m.evaluation?.overall_match_score) {
              totalScoreSum += m.evaluation.overall_match_score;
              scoreCount++;
            }
          });
          this.totalCandidates.set(candidateCount);
          if (scoreCount > 0) {
            this.avgMatchScore.set(Math.round(totalScoreSum / scoreCount));
          }
        }
      });
    });
  }

  get filteredJobs(): JobResponse[] {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.jobs();
    return this.jobs().filter(job => 
      job.title?.toLowerCase().includes(term) ||
      job.criteria?.title?.toLowerCase().includes(term) ||
      job.criteria?.seniority_level?.toLowerCase().includes(term)
    );
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  goToJobReview(jobId: string) {
    this.router.navigate(['/recruiter/jobs', jobId]);
  }

  goToCreateJob() {
    this.router.navigate(['/recruiter/create']);
  }

  goToCandidateBoard() {
    this.router.navigate(['/apply']);
  }

  goToApplyJob(jobId: string) {
    this.router.navigate(['/apply', jobId]);
  }
}


