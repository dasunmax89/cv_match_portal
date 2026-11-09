import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CandidateDirectoryItem, CandidateAppliedJobSummary } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-recruiter-candidates',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './candidates.component.html'
})
export class RecruiterCandidatesComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  candidates = signal<CandidateDirectoryItem[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  activeFilter = signal<'all' | 'shortlisted' | 'interview' | 'multiple'>('all');

  ngOnInit() {
    this.fetchCandidates();
  }

  fetchCandidates() {
    this.isLoading.set(true);
    this.apiService.getRecruiterCandidates().subscribe({
      next: (data) => {
        this.candidates.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recruiter candidates:', err);
        this.isLoading.set(false);
      }
    });
  }

  get filteredCandidates(): CandidateDirectoryItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();

    return this.candidates().filter(c => {
      // 1. Text Search
      const matchesQuery = !q || (
        c.candidateName.toLowerCase().includes(q) ||
        c.candidateEmail.toLowerCase().includes(q) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(q))) ||
        (c.applications && c.applications.some(a => a.jobTitle.toLowerCase().includes(q)))
      );
      if (!matchesQuery) return false;

      // 2. Tab Filter
      if (filter === 'shortlisted') {
        return c.applications.some(a => a.status === 'Shortlisted');
      }
      if (filter === 'interview') {
        return c.applications.some(a => !!a.interview?.scheduled_at);
      }
      if (filter === 'multiple') {
        return c.totalApplications > 1;
      }
      return true;
    });
  }

  openCandidateMatching(app: CandidateAppliedJobSummary, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.router.navigate(['/recruiter/jobs', app.jobId], {
      queryParams: { candidateId: app.id }
    });
  }

  getScoreColor(score?: number): string {
    if (score === undefined || score === null) return 'text-[#4E6770] bg-[#F8FBFA] border-[#D5EDED]';
    if (score >= 80) return 'text-[#244653] bg-[#CBF1F5] border-[#71C9CE]';
    if (score >= 65) return 'text-[#244653] bg-[#E3FDFD] border-[#A6E3E9]';
    return 'text-[#854D0E] bg-[#FEF9C3] border-[#FEF08A]';
  }

  getVerdictBadge(verdict?: string): string {
    if (!verdict) return 'bg-[#F8FBFA] text-[#4E6770] border-[#D5EDED]';
    const v = verdict.toLowerCase();
    if (v.includes('strong')) return 'bg-[#CBF1F5] text-[#244653] border-[#71C9CE]';
    if (v.includes('moderate')) return 'bg-[#E3FDFD] text-[#244653] border-[#A6E3E9]';
    if (v.includes('shortlisted')) return 'bg-[#244653] text-[#CBF1F5] border-[#244653]';
    if (v.includes('rejected')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-[#E3FDFD] text-[#244653] border-[#A6E3E9]';
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
