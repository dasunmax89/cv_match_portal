export interface ParsedCriteria {
  title: string;
  seniority_level: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  minimum_years_experience: number;
  core_responsibilities: string[];
}

export interface SJTQuestionOption {
  key: string;
  text: string;
}

export interface PublicSJTQuestion {
  id: string;
  scenario: string;
  options: SJTQuestionOption[];
}

export interface AssessmentMetadata {
  framework?: string;
  primary_traits?: string[];
}

export interface PublicSJTAssessment {
  job_id: string;
  title: string;
  questions: PublicSJTQuestion[];
  assessment_metadata?: AssessmentMetadata;
}

export interface JobSJTAssessment {
  assessment_metadata?: AssessmentMetadata;
  questions: PublicSJTQuestion[];
}

export interface CandidateAnswer {
  question_id: string;
  selected_key: string;
}

export interface CandidateBehavioralEvaluation {
  candidate_id?: string;
  score_percentage: number;
  verdict: string;
  behavioral_archetype: string;
  risk_flags: string[];
  client_interview_probes: string[];
}

export interface InterviewResult {
  rating?: number;
  technical_score?: number;
  culture_score?: number;
  communication_score?: number;
  internal_notes?: string;
  candidate_feedback?: string;
  evaluated_by?: string;
  evaluated_at?: string;
}

export interface InterviewDetails {
  scheduled_at?: string;
  location?: string;
  custom_message?: string;
  updated_at?: string;
  status?: string; // 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show'
  outcome?: 'Pending' | 'Passed' | 'Failed';
  result?: InterviewResult;
}

export interface InterviewDecisionRequest {
  outcome: 'Passed' | 'Failed';
  result?: InterviewResult;
  notify_candidate: boolean;
  custom_email_message?: string;
  recruiter_email?: string;
}

export interface SaveInterviewNotesRequest {
  result: InterviewResult;
  recruiter_email?: string;
}

export interface ScheduledInterviewItem {
  id: string;
  jobId: string;
  jobTitle: string;
  seniorityLevel?: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  overall_match_score?: number;
  fit_verdict?: string;
  behavioral_archetype?: string;
  client_interview_probes?: string[];
  interview?: InterviewDetails;
  resumeUrl?: string;
  linkedin_url?: string;
  createdAt?: string;
}

export interface JobInterviewsGroup {
  jobId: string;
  jobTitle: string;
  seniorityLevel?: string;
  totalInterviews: number;
  pendingInterviews: number;
  passedInterviews: number;
  failedInterviews: number;
  interviews: ScheduledInterviewItem[];
}

export interface RecruiterInterviewsOverviewResponse {
  totalScheduled: number;
  happeningToday: number;
  needsEvaluation: number;
  totalPassed: number;
  totalFailed: number;
  groups: JobInterviewsGroup[];
}

export interface CandidateMatch {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  createdAt: string;
  evaluation?: {
    overall_match_score: number;
    fit_verdict: 'Strong Match' | 'Moderate Match' | 'Weak Match';
    skills_score: number;
    experience_score: number;
    key_strengths: string[];
    gaps_and_red_flags: string[];
    concise_rationale: string;
  };
  behavioral_evaluation?: CandidateBehavioralEvaluation;
  candidate_answers?: CandidateAnswer[];
  status?: string;
  resumeUrl?: string;
  interview?: InterviewDetails;
  linkedin_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
}


export interface JobResponse {
  id: string;
  title: string;
  criteria: ParsedCriteria;
  assessment?: PublicSJTAssessment | JobSJTAssessment;
  createdAt: string;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  seniorityLevel?: string;
  minimumYearsExperience?: number;
  requiredSkills?: string[];
  coreResponsibilities?: string[];
  candidateName: string;
  candidateEmail: string;
  status: string;
  evaluation?: {
    overall_match_score?: number;
    fit_verdict?: string;
    skills_score?: number;
    experience_score?: number;
    key_strengths?: string[];
    gaps_and_red_flags?: string[];
    concise_rationale?: string;
  };
  behavioral_evaluation?: CandidateBehavioralEvaluation;
  interview?: InterviewDetails;
  resumeUrl?: string;
  linkedin_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  createdAt: string;
}

export interface JobOverviewItem extends JobResponse {
  candidates_count: number;
  applied_candidates: CandidateMatch[];
}

export interface CandidateAppliedJobSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  seniorityLevel?: string;
  status: string;
  overall_match_score?: number;
  fit_verdict?: string;
  interview?: InterviewDetails;
  resumeUrl?: string;
  createdAt: string;
}

export interface CandidateDirectoryItem {
  candidateEmail: string;
  candidateName: string;
  phone?: string;
  skills?: string[];
  bio?: string;
  experienceYears?: number;
  linkedin_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  totalApplications: number;
  latestAppliedAt?: string;
  applications: CandidateAppliedJobSummary[];
}


