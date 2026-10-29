import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { JobOverviewItem, CandidateMatch } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-recruiter-job-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './job-list.component.html'
})
export class RecruiterJobListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  jobs = signal<JobOverviewItem[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.isLoading.set(true);
    this.apiService.getRecruiterJobsOverview().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recruiter jobs overview, falling back to basic jobs:', err);
        this.apiService.getRecruiterJobs().subscribe({
          next: (jobs) => {
            const overview: JobOverviewItem[] = jobs.map(j => ({
              ...j,
              candidates_count: 0,
              applied_candidates: []
            }));
            this.jobs.set(overview);
            this.isLoading.set(false);
          },
          error: (fallbackErr) => {
            console.error('Failed to load recruiter jobs:', fallbackErr);
            this.isLoading.set(false);
          }
        });
      }
    });
  }

  get filteredJobs(): JobOverviewItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.jobs();
    return this.jobs().filter(j => 
      j.title.toLowerCase().includes(q) ||
      j.criteria?.title?.toLowerCase().includes(q) ||
      j.criteria?.required_skills?.some(s => s.toLowerCase().includes(q)) ||
      j.applied_candidates?.some(c => 
        c.candidateName?.toLowerCase().includes(q) || 
        c.candidateEmail?.toLowerCase().includes(q)
      )
    );
  }

  openJobDetails(job: JobOverviewItem) {
    this.router.navigate(['/recruiter/jobs', job.id, 'details']);
  }

  viewJobDetails(job: JobOverviewItem, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/recruiter/jobs', job.id, 'details']);
  }

  openCandidateDeck(job: JobOverviewItem, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/recruiter/jobs', job.id]);
  }

  openCandidateMatching(job: JobOverviewItem, candidate: CandidateMatch, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/recruiter/jobs', job.id], {
      queryParams: { candidateId: candidate.id }
    });
  }

  createNewJob() {
    this.router.navigate(['/recruiter/create']);
  }

  hasBehavioralCheck(job: JobOverviewItem): boolean {
    return !!(job.assessment && job.assessment.questions && job.assessment.questions.length > 0);
  }

  getScoreColor(score?: number): string {
    if (score === undefined || score === null) return 'text-[#4E6770] bg-[#F8FBFA] border-[#D5EDED]';
    if (score >= 80) return 'text-[#244653] bg-[#CBF1F5] border-[#71C9CE] font-bold';
    if (score >= 65) return 'text-[#244653] bg-[#E3FDFD] border-[#A6E3E9] font-semibold';
    return 'text-[#172B32] bg-amber-50 border-amber-200';
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
