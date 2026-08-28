import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { JobResponse } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-board.component.html'
})
export class JobBoardComponent implements OnInit {
  private apiService = inject(ApiService);
  
  jobs = signal<JobResponse[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.apiService.getPublicJobs().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load jobs', err);
        this.error.set('Could not load jobs at this time. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }
}
