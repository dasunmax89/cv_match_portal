import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CandidateApplication } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-candidate-applied-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applied-jobs.component.html'
})
export class CandidateAppliedJobsComponent implements OnInit {
  private apiService = inject(ApiService);
  public authService = inject(AuthService);
  private router = inject(Router);

  applications = signal<CandidateApplication[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<'all' | 'interview' | 'shortlisted' | 'pending'>('all');
  selectedJobForModal = signal<CandidateApplication | null>(null);

  ngOnInit() {
    this.fetchAppliedJobs();
  }

  fetchAppliedJobs() {
    this.isLoading.set(true);
    const user = this.authService.candidateUser();
    const email = user?.email || user?.candidateEmail || '';

    this.apiService.getCandidateAppliedJobs(email).subscribe({
      next: (data) => {
        this.applications.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidate applied jobs:', err);
        this.isLoading.set(false);
      }
    });
  }

  get filteredApplications(): CandidateApplication[] {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedStatusFilter();

    return this.applications().filter(app => {
      const matchesSearch = !q || (
        app.jobTitle.toLowerCase().includes(q) ||
        (app.seniorityLevel && app.seniorityLevel.toLowerCase().includes(q)) ||
        (app.requiredSkills && app.requiredSkills.some(s => s.toLowerCase().includes(q)))
      );
      if (!matchesSearch) return false;

      if (filter === 'interview') {
        return !!app.interview?.scheduled_at;
      }
      if (filter === 'shortlisted') {
        return app.status?.toLowerCase() === 'shortlisted';
      }
      if (filter === 'pending') {
        return !app.interview?.scheduled_at && app.status?.toLowerCase() !== 'shortlisted' && app.status?.toLowerCase() !== 'rejected';
      }
      return true;
    });
  }

  get totalApplicationsCount(): number {
    return this.applications().length;
  }

  get shortlistedCount(): number {
    return this.applications().filter(a => a.status?.toLowerCase() === 'shortlisted').length;
  }

  get interviewCount(): number {
    return this.applications().filter(a => !!a.interview?.scheduled_at).length;
  }

  get pendingCount(): number {
    return this.applications().filter(a => 
      !a.interview?.scheduled_at && a.status?.toLowerCase() !== 'shortlisted' && a.status?.toLowerCase() !== 'rejected'
    ).length;
  }

  openJobModal(app: CandidateApplication) {
    this.selectedJobForModal.set(app);
  }

  closeJobModal() {
    this.selectedJobForModal.set(null);
  }

  getStatusBadgeClass(status?: string, hasInterview?: boolean): string {
    if (status === 'Interview Passed') return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    if (hasInterview) return 'bg-sky-50 text-sky-800 border-sky-300';
    if (!status) return 'bg-slate-100 text-slate-700 border-slate-200';
    const s = status.toLowerCase();
    if (s === 'shortlisted') return 'bg-teal-50 text-teal-800 border-teal-300';
    if (s.includes('strong')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (s.includes('moderate')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (s === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }

  getStatusLabel(app: CandidateApplication): string {
    if (app.status === 'Interview Passed' || app.interview?.outcome === 'Passed') return 'Interview Passed ✓';
    if (app.status === 'Rejected' && app.interview?.outcome === 'Failed') return 'Interview Concluded';
    if (app.interview?.scheduled_at) return 'Interview Scheduled';
    if (app.status === 'Shortlisted') return 'Shortlisted';
    if (app.evaluation?.fit_verdict) return app.evaluation.fit_verdict;
    return app.status || 'Under Review';
  }

  formatDisplayDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  isMapUrl(str?: string): boolean {
    if (!str) return false;
    const s = str.toLowerCase();
    return s.startsWith('http://') || s.startsWith('https://') || s.includes('maps.google') || s.includes('goo.gl');
  }
}
