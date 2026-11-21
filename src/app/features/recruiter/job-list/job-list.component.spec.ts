import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecruiterJobListComponent } from './job-list.component';
import { ApiService } from '../../../core/services/api.service';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { JobOverviewItem } from '../../../core/models/candidate.models';

describe('RecruiterJobListComponent', () => {
  let component: RecruiterJobListComponent;
  let fixture: ComponentFixture<RecruiterJobListComponent>;
  let mockApiService: any;

  const mockJobs: JobOverviewItem[] = [
    {
      id: 'job-1',
      title: 'Apperal Engineer',
      criteria: {
        title: 'Apperal Engineer',
        seniority_level: 'Senior',
        required_skills: ['Pattern Making', 'Fabric Inspection', 'CAD', 'Quality Control'],
        nice_to_have_skills: [],
        minimum_years_experience: 5,
        core_responsibilities: ['"Manage production line and design apparel prototypes"']
      },
      preliminary_job_order: {
        job_category: 'Manufacturing',
        job_description: 'Manage apparel operations',
        total_approved_quantity: 50,
        minimum_qualifications: 'Degree in Textile Engineering',
        monthly_salary: 4500,
        salary_currency: 'RM',
        regular_work_hours: '40 hours per week',
        contract_period: '2 years',
        other_employee_benefits: 'Medical insurance'
      },
      candidates_count: 3,
      applied_candidates: [
        {
          id: 'c-1',
          jobId: 'job-1',
          candidateName: 'John Doe',
          candidateEmail: 'john@example.com',
          status: 'Applied',
          evaluation: {
            overall_match_score: 92,
            fit_verdict: 'Strong Match',
            skills_score: 90,
            experience_score: 94,
            key_strengths: ['CAD', 'Patterns'],
            gaps_and_red_flags: [],
            concise_rationale: 'Excellent candidate'
          },
          createdAt: '2026-01-01'
        },
        {
          id: 'c-2',
          jobId: 'job-1',
          candidateName: 'Jane Smith',
          candidateEmail: 'jane@example.com',
          status: 'Applied',
          evaluation: {
            overall_match_score: 85,
            fit_verdict: 'Strong Match',
            skills_score: 80,
            experience_score: 90,
            key_strengths: ['Fabric Inspection'],
            gaps_and_red_flags: [],
            concise_rationale: 'Great candidate'
          },
          createdAt: '2026-01-02'
        },
        {
          id: 'c-1', // Duplicate candidate ID
          jobId: 'job-1',
          candidateName: 'John Doe',
          candidateEmail: 'john@example.com',
          status: 'Applied',
          evaluation: {
            overall_match_score: 92,
            fit_verdict: 'Strong Match',
            skills_score: 90,
            experience_score: 94,
            key_strengths: ['CAD', 'Patterns'],
            gaps_and_red_flags: [],
            concise_rationale: 'Excellent candidate'
          },
          createdAt: '2026-01-01'
        }
      ],
      createdAt: '2026-01-01T10:00:00Z',
      assessment: {
        questions: [
          {
            id: 'q1',
            scenario: 'Factory floor emergency',
            options: [{ key: 'A', text: 'Evacuate' }]
          }
        ]
      }
    },
    {
      id: 'job-2',
      title: 'Factory General Worker',
      criteria: {
        title: 'Factory General Worker',
        seniority_level: 'Entry',
        required_skills: ['Packaging', 'Safety'],
        nice_to_have_skills: [],
        minimum_years_experience: 0,
        core_responsibilities: []
      },
      preliminary_job_order: {
        job_category: 'Factory',
        job_description: 'General packing tasks on assembly line',
        total_approved_quantity: 100,
        minimum_qualifications: 'N/A',
        monthly_salary: 2000,
        salary_currency: 'RM',
        regular_work_hours: '48 hours per week',
        contract_period: '1 year',
        other_employee_benefits: 'Hostel provided'
      },
      candidates_count: 0,
      applied_candidates: [],
      createdAt: '2026-01-05T10:00:00Z'
    },
    {
      id: 'job-3',
      title: 'Pending Score Worker',
      criteria: {
        title: 'Pending Score Worker',
        seniority_level: 'Junior',
        required_skills: ['Sorting'],
        nice_to_have_skills: [],
        minimum_years_experience: 1,
        core_responsibilities: []
      },
      candidates_count: 1,
      applied_candidates: [
        {
          id: 'c-3',
          jobId: 'job-3',
          candidateName: 'Alice Green',
          candidateEmail: 'alice@example.com',
          status: 'Applied',
          createdAt: '2026-01-06'
        }
      ],
      createdAt: '2026-01-06T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockApiService = {
      getRecruiterJobsOverview: () => of(mockJobs),
      getRecruiterJobs: () => of(mockJobs)
    };

    await TestBed.configureTestingModule({
      imports: [RecruiterJobListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecruiterJobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load recruiter jobs', () => {
    expect(component.jobs().length).toBe(3);
    expect(component.isLoading()).toBe(false);
  });

  it('should sanitize "Apperal" typo to "Apparel" in getCleanJobTitle', () => {
    const job = mockJobs[0];
    expect(component.getCleanJobTitle(job)).toBe('Apparel Engineer');
  });

  it('should return distinct candidates without duplicates in getDistinctCandidates', () => {
    const job = mockJobs[0];
    const distinct = component.getDistinctCandidates(job);
    expect(distinct.length).toBe(2);
    expect(distinct[0].candidateEmail).toBe('john@example.com');
    expect(distinct[1].candidateEmail).toBe('jane@example.com');
  });

  it('should compute the correct top match score and format with %', () => {
    const job = mockJobs[0];
    expect(component.getTopMatchScore(job)).toBe('92%');
    expect(component.getTopMatchBadgeClass(job)).toContain('bg-[#CBF1F5]');
  });

  it('should return "Pending" instead of a bare % when candidates have no score', () => {
    const job = mockJobs[2];
    expect(component.getTopMatchScore(job)).toBe('Pending');
    expect(component.getTopMatchBadgeClass(job)).toContain('text-[#4E6770]');
  });

  it('should clean quotation marks from role summary in getRoleSummary', () => {
    const job = mockJobs[0];
    expect(component.getRoleSummary(job)).toBe('Manage production line and design apparel prototypes');
  });

  it('should fallback to preliminary job order description if core responsibilities are empty', () => {
    const job = mockJobs[1];
    expect(component.getRoleSummary(job)).toBe('General packing tasks on assembly line');
  });

  it('should render the responsive 3-column grid with items-stretch and full height cards', () => {
    const el = fixture.nativeElement as HTMLElement;
    const grid = el.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grid).toBeTruthy();
    expect(grid?.classList.contains('items-stretch')).toBe(true);

    const cards = el.querySelectorAll('.group.relative.bg-white.rounded-xl');
    expect(cards.length).toBe(3);
    const firstCard = cards[0];
    expect(firstCard.classList.contains('flex')).toBe(true);
    expect(firstCard.classList.contains('flex-col')).toBe(true);
    expect(firstCard.classList.contains('justify-between')).toBe(true);
    expect(firstCard.classList.contains('h-full')).toBe(true);
  });

  it('should render single-row skills with max 3 keyword pills and +N overflow pill', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.group.relative.bg-white.rounded-xl');
    const firstCard = cards[0];
    
    // Skills container
    const skillsStrip = firstCard.querySelector('.flex.items-center.gap-1\\.5.overflow-hidden.mt-4');
    expect(skillsStrip).toBeTruthy();
    
    // 3 skill tags + 1 overflow counter pill
    const skillPills = skillsStrip?.querySelectorAll('span');
    expect(skillPills?.length).toBe(4);
    expect(skillPills?.[0].textContent?.trim()).toBe('Pattern Making');
    expect(skillPills?.[3].textContent?.trim()).toBe('+1');
  });

  it('should render candidate summary bar with avatars and top match when candidates exist', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.group.relative.bg-white.rounded-xl');
    const firstCard = cards[0];

    // Candidate count text
    expect(firstCard.textContent).toContain('2 Candidates');
    expect(firstCard.textContent).toContain('Top Match:');
    expect(firstCard.textContent).toContain('92%');
  });

  it('should render empty state message in candidate summary bar when no candidates applied', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.group.relative.bg-white.rounded-xl');
    const secondCard = cards[1];

    expect(secondCard.textContent).toContain('No candidates applied yet');
  });

  it('should render footer action bar with creation date, View Job link, and Evaluate button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.group.relative.bg-white.rounded-xl');
    const firstCard = cards[0];

    expect(firstCard.textContent).toContain('Created Jan 1, 2026');
    expect(firstCard.textContent).toContain('Behavioral Check');
    expect(firstCard.textContent).toContain('View Job');
    expect(firstCard.textContent).toContain('Evaluate (2)');
  });
});
