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
}

export interface JobResponse {
  id: string;
  title: string;
  criteria: ParsedCriteria;
  assessment?: PublicSJTAssessment | JobSJTAssessment;
  createdAt: string;
}

