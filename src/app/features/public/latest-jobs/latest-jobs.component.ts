import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { JobResponse } from '../../../core/models/candidate.models';

export interface DisplayJob {
  id: string;
  title: string;
  company: string;
  location: string;
  workArrangement: string;
  seniorityLevel: string;
  experienceYears: number;
  salaryRange: string;
  postedDate: string;
  skills: string[];
  description: string;
}

@Component({
  selector: 'app-public-latest-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './latest-jobs.component.html'
})
export class PublicLatestJobsComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);
  
  // Public fraction jobs list
  allJobs = signal<DisplayJob[]>([]);

  // Default mock fallback jobs for rich public showcase
  private sampleJobs: DisplayJob[] = [
    {
      id: 'job-sample-1',
      title: 'Senior Fullstack Engineer (Angular & Python)',
      company: 'TechFlow Systems',
      location: 'San Francisco, CA / Remote',
      workArrangement: 'Remote',
      seniorityLevel: 'Senior Level',
      experienceYears: 5,
      salaryRange: '$140,000 - $175,000',
      postedDate: '2 hours ago',
      skills: ['Angular', 'Python', 'FastAPI', 'PostgreSQL', 'Docker'],
      description: 'Architect scalable web microservices and high-performance client applications powered by modern reactive state management and Python APIs.'
    },
    {
      id: 'job-sample-2',
      title: 'Lead AI & Machine Learning Infrastructure Architect',
      company: 'Nexus Intelligence',
      location: 'New York, NY / Hybrid',
      workArrangement: 'Hybrid',
      seniorityLevel: 'Lead / Principal',
      experienceYears: 7,
      salaryRange: '$180,000 - $220,000',
      postedDate: '1 day ago',
      skills: ['PyTorch', 'LLMs', 'Kubernetes', 'Python', 'Vector DBs'],
      description: 'Drive production deployment of LLM fine-tuning pipelines, high-throughput vector search databases, and automated AI evaluation metrics.'
    },
    {
      id: 'job-sample-3',
      title: 'Cloud DevOps & Site Reliability Engineer',
      company: 'CloudScale Global',
      location: 'Austin, TX / Remote',
      workArrangement: 'Remote',
      seniorityLevel: 'Mid-Senior Level',
      experienceYears: 4,
      salaryRange: '$130,000 - $160,000',
      postedDate: '2 days ago',
      skills: ['AWS', 'Terraform', 'Kubernetes', 'CI/CD', 'Prometheus'],
      description: 'Optimize automated infrastructure provisioning, multi-region Kubernetes clusters, and zero-downtime deployment pipelines.'
    },
    {
      id: 'job-sample-4',
      title: 'Staff Frontend Specialist (TypeScript / Modern Web)',
      company: 'Vanguard Digital',
      location: 'Boston, MA / Remote',
      workArrangement: 'Remote',
      seniorityLevel: 'Staff Level',
      experienceYears: 6,
      salaryRange: '$150,000 - $190,000',
      postedDate: '3 days ago',
      skills: ['TypeScript', 'Angular', 'TailwindCSS', 'Web Performance', 'Micro-frontends'],
      description: 'Lead design systems, micro-frontend architecture, and core Web Vitals optimization across critical web enterprise portals.'
    }
  ];

  filteredJobs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.allJobs();
    return this.allJobs().filter(job => 
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some(s => s.toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    this.isLoading.set(true);
    this.apiService.getPublicJobs().subscribe({
      next: (apiJobs) => {
        if (apiJobs && apiJobs.length > 0) {
          const mapped: DisplayJob[] = apiJobs.slice(0, 6).map(j => ({
            id: j.id,
            title: j.title || j.criteria?.title || 'Engineering Opportunity',
            company: 'Partner Enterprise',
            location: 'Remote / Flexible',
            workArrangement: 'Remote Preferred',
            seniorityLevel: j.criteria?.seniority_level || 'Mid-Senior Level',
            experienceYears: j.criteria?.minimum_years_experience || 3,
            salaryRange: 'Competitive Tech Package',
            postedDate: 'Recently Posted',
            skills: j.criteria?.required_skills || ['TypeScript', 'Python'],
            description: j.criteria?.core_responsibilities?.[0] || 'Exciting tech role matching top candidate profiles.'
          }));
          this.allJobs.set(mapped);
        } else {
          this.allJobs.set(this.sampleJobs);
        }
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback to sample public showcase jobs
        this.allJobs.set(this.sampleJobs);
        this.isLoading.set(false);
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/candidate/login']);
  }

  navigateToOnboarding() {
    this.router.navigate(['/candidate/onboarding']);
  }

  navigateToRecruiterLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  navigateToManagementLogin() {
    this.router.navigate(['/management/login']);
  }
}
