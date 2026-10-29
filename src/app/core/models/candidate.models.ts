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

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  label?: string;
  flag: string;
}

export const POPULAR_CURRENCIES: CurrencyOption[] = [
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', label: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'USD', symbol: '$', name: 'US Dollar', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', label: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', label: 'British Pound', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', label: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', label: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', label: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', label: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', label: 'UAE Dirham', flag: '🇦🇪' }
];

export interface ContractOffer {
  offer_id: string;
  job_id: string;
  match_id: string;
  candidate_id?: string;
  candidate_name: string;
  candidate_email: string;
  recruiter_email?: string;
  company_name?: string;
  company_cc_email?: string;
  currency: string;
  annual_base_salary: number;
  bonus_or_allowances?: number;
  start_date: string;
  contract_type: string;
  probation_period_months?: number;
  notes_or_terms?: string;
  commission_rate_percent: number;
  commission_amount: number;
  commission_status: 'Pending' | 'Invoiced' | 'Paid' | 'Waived';
  invoice_reference_id?: string;
  contract_pdf_url?: string;
  contract_title?: string;
  signed_by_candidate: boolean;
  signed_at?: string;
  signature_legal_name?: string;
  signed_name?: string;
  decline_reason?: string;
  declined_at?: string;
  status: 'Draft' | 'Offered' | 'Accepted' | 'Declined' | 'Started' | 'Cancelled';
  created_at: string;
  updated_at?: string;
}

export interface CreateOfferRequest {
  annual_base_salary: number;
  currency: string;
  bonus_or_allowances?: number;
  start_date: string;
  contract_type?: string;
  probation_period_months?: number;
  notes_or_terms?: string;
  company_cc_email?: string;
  contract_title?: string;
  commission_rate_percent?: number;
  recruiter_email?: string;
  is_draft?: boolean;
}

export interface SignOfferRequest {
  legal_name?: string;
  signed_name?: string;
  confirmed_start_date?: string;
  candidate_email?: string;
}

export interface DeclineOfferRequest {
  reason?: string;
  candidate_email?: string;
}

export interface UpdateCommissionRequest {
  commission_status: 'Pending' | 'Invoiced' | 'Paid' | 'Waived';
  invoice_reference_id?: string;
  invoice_reference?: string;
  notes?: string;
}

export interface PlacementOverviewItem {
  matchId: string;
  match_id?: string;
  jobId: string;
  job_id?: string;
  jobTitle: string;
  job_title?: string;
  candidateName: string;
  candidate_name?: string;
  candidateEmail: string;
  candidate_email?: string;
  profile_image?: string;
  profileImage?: string;
  recruiterEmail?: string;
  recruiter_email?: string;
  companyName?: string;
  company_name?: string;
  companyCcEmail?: string;
  company_cc_email?: string;
  currency: string;
  annualBaseSalary: number;
  annual_base_salary?: number;
  startDate: string;
  start_date?: string;
  offerStatus: string;
  offer_status?: string;
  signedAt?: string;
  signed_at?: string;
  signatureLegalName?: string;
  signature_legal_name?: string;
  signed_name?: string;
  commissionRatePercent: number;
  commission_rate_percent?: number;
  commissionAmount: number;
  commission_amount?: number;
  commissionStatus: string;
  commission_status?: string;
  invoiceReferenceId?: string;
  invoice_reference?: string;
  notes?: string;
  createdAt: string;
  created_at?: string;
}

export interface ManagementPlacementsResponse {
  totalPlacements: number;
  total_placements?: number;
  totalOffered: number;
  total_offered?: number;
  totalAccepted: number;
  total_accepted?: number;
  totalCommissionPending: number;
  total_commission_pending?: number;
  total_commission_estimated?: number;
  totalCommissionPaid: number;
  total_commission_paid?: number;
  placements: PlacementOverviewItem[];
}

export interface ScheduledInterviewItem {
  id: string;
  jobId: string;
  jobTitle: string;
  seniorityLevel?: string;
  candidateName: string;
  candidateEmail: string;
  profile_image?: string;
  profileImage?: string;
  status: string;
  overall_match_score?: number;
  fit_verdict?: string;
  behavioral_archetype?: string;
  client_interview_probes?: string[];
  interview?: InterviewDetails;
  offer?: ContractOffer;
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
  totalOffersDrafting?: number;
  totalOffersExtended?: number;
  totalOffersAccepted?: number;
  groups: JobInterviewsGroup[];
}

export interface CandidateMatch {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  profile_image?: string;
  profileImage?: string;
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
  offer?: ContractOffer;
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
  profile_image?: string;
  profileImage?: string;
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
  offer?: ContractOffer;
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
  profile_image?: string;
  profileImage?: string;
  interview?: InterviewDetails;
  offer?: ContractOffer;
  resumeUrl?: string;
  createdAt: string;
}

export interface CandidateDirectoryItem {
  candidateEmail: string;
  candidateName: string;
  profile_image?: string;
  profileImage?: string;
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


