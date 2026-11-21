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

  getCleanJobTitle(job: JobOverviewItem): string {
    const title = job.title || job.criteria?.title || 'Job Opening';
    return title.replace(/\bApperal\b/gi, 'Apparel');
  }

  getDistinctCandidates(job: JobOverviewItem): CandidateMatch[] {
    const candidates = job.applied_candidates || [];
    const seen = new Set<string>();
    const distinct: CandidateMatch[] = [];
    for (const c of candidates) {
      const key = (c.id || c.candidateEmail || '').trim().toLowerCase();
      if (key && seen.has(key)) {
        continue;
      }
      if (key) {
        seen.add(key);
      }
      distinct.push(c);
    }
    return distinct;
  }

  getTopMatchScore(job: JobOverviewItem): string {
    const candidates = this.getDistinctCandidates(job);
    const scores = candidates
      .map(c => c.evaluation?.overall_match_score)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s) && s >= 0);
    if (scores.length === 0) {
      return 'Pending';
    }
    const maxScore = Math.round(Math.max(...scores));
    return `${maxScore}%`;
  }

  getTopMatchBadgeClass(job: JobOverviewItem): string {
    const scoreStr = this.getTopMatchScore(job);
    if (scoreStr === 'Pending') {
      return 'bg-[#F8FBFA] text-[#4E6770] border-[#D5EDED] font-medium';
    }
    const score = parseInt(scoreStr, 10);
    if (score >= 80) {
      return 'bg-[#CBF1F5] text-[#244653] border-[#71C9CE] font-bold';
    }
    if (score >= 65) {
      return 'bg-[#E3FDFD] text-[#244653] border-[#A6E3E9] font-semibold';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
  }

  getRoleSummary(job: JobOverviewItem): string {
    let summary = '';
    if (job.criteria?.core_responsibilities?.length) {
      summary = job.criteria.core_responsibilities[0];
    } else if (job.preliminary_job_order?.job_description || job.preliminaryJobOrder?.job_description) {
      summary = job.preliminary_job_order?.job_description || job.preliminaryJobOrder?.job_description || '';
    } else if (job.criteria?.job_description) {
      summary = job.criteria.job_description;
    } else if ((job as any).description) {
      summary = (job as any).description;
    }
    return summary.replace(/^["'“‘]+|["'”’]+$/g, '').trim() || 'No role summary provided.';
  }

  getHeadcount(job: JobOverviewItem): number | null {
    return job.preliminary_job_order?.total_approved_quantity || job.preliminaryJobOrder?.total_approved_quantity || null;
  }

  getSalary(job: JobOverviewItem): string | null {
    const pjo = job.preliminary_job_order || job.preliminaryJobOrder;
    if (!pjo?.monthly_salary) return null;
    const formattedSalary = Number(pjo.monthly_salary).toLocaleString();
    const currency = pjo.salary_currency || 'RM';
    return `${formattedSalary} ${currency}`;
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
