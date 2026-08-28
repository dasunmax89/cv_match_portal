export interface ParsedCriteria {
  title: string;
  seniority_level: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  minimum_years_experience: number;
  core_responsibilities: string[];
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
  status?: string;
}

export interface JobResponse {
  id: string;
  title: string;
  criteria: ParsedCriteria;
  createdAt: string;
}
