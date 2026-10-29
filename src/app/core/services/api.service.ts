import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { 
  ParsedCriteria, 
  CandidateMatch, 
  JobResponse, 
  PublicSJTAssessment, 
  CandidateAnswer, 
  JobOverviewItem, 
  CandidateDirectoryItem, 
  CandidateApplication,
  RecruiterInterviewsOverviewResponse,
  InterviewDecisionRequest,
  SaveInterviewNotesRequest,
  CreateOfferRequest,
  SignOfferRequest,
  DeclineOfferRequest,
  UpdateCommissionRequest,
  ManagementPlacementsResponse
} from '../models/candidate.models';
import { hashPasswordClient } from '../utils/crypto.utils';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  private get baseUrl(): string {
    if ((window as any).__API_URL__) {
      return (window as any).__API_URL__;
    }
    if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (window.location.hostname.includes('azurecontainerapps.io')) {
        const apiHost = window.location.hostname.replace(/^angular-ui[a-z0-9-]*\./, 'accepting-api.');
        return `${window.location.protocol}//${apiHost}/api/v1`;
      }
    }
    return 'http://127.0.0.1:8080/api/v1';
  }

  login(email: string, password: string): Observable<any> {
    const rawPass = password || '';
    return from(hashPasswordClient(rawPass)).pipe(
      switchMap(passwordHash =>
        this.http.post(`${this.baseUrl}/auth/login`, { email, password_hash: passwordHash })
      )
    );
  }

  loginWithGoogle(credential: string, role: string = 'candidate', accessToken?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/google`, {
      credential,
      access_token: accessToken,
      role
    });
  }

  signup(email: string, password: string, fullName?: string, extraData?: any): Observable<any> {
    const rawPass = password || '';
    return from(hashPasswordClient(rawPass)).pipe(
      switchMap(passwordHash =>
        this.http.post(`${this.baseUrl}/auth/signup`, {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          ...(extraData || {})
        })
      )
    );
  }

  signupRecruiter(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    designation?: string;
  }): Observable<any> {
    const rawPass = data.password || '';
    return from(hashPasswordClient(rawPass)).pipe(
      switchMap(passwordHash =>
        this.http.post(`${this.baseUrl}/auth/signup/recruiter`, {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          password_hash: passwordHash,
          designation: data.designation
        })
      )
    );
  }

  signupCompany(data: {
    companyName: string;
    website: string;
    industry: string;
    tagline: string;
    email: string;
    password: string;
    phone?: string;
    telephone?: string;
    logoData?: string | null;
  }): Observable<any> {
    const rawPass = data.password || '';
    const phoneVal = (data.phone || data.telephone || '').trim();
    return from(hashPasswordClient(rawPass)).pipe(
      switchMap(passwordHash =>
        this.http.post(`${this.baseUrl}/auth/signup/company`, {
          company_name: data.companyName,
          website: data.website,
          industry: data.industry,
          tagline: data.tagline,
          email: data.email,
          phone: phoneVal,
          telephone: phoneVal,
          password_hash: passwordHash,
          logo_data: data.logoData
        })
      )
    );
  }

  verifyOtp(email: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-otp`, { email, code });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/resend-otp`, { email });
  }

  requestPasswordReset(email: string, role?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password/request`, { email, role });
  }

  resendPasswordResetOtp(email: string, role?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password/resend-otp`, { email, role });
  }

  resetPassword(payload: { email: string; code: string; newPassword: string }): Observable<any> {
    const rawPass = payload.newPassword || '';
    return from(hashPasswordClient(rawPass)).pipe(
      switchMap(passwordHash =>
        this.http.post(`${this.baseUrl}/auth/forgot-password/reset`, {
          email: payload.email,
          code: payload.code,
          password_hash: passwordHash
        })
      )
    );
  }


  authenticateUser(payload: { username: string; password_hash: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/authenticate`, payload);
  }


  uploadJd(title: string | undefined, file: File): Observable<JobResponse> {
    const formData = new FormData();
    if (title && title.trim()) {
      formData.append('title', title.trim());
    }
    formData.append('file', file);
    return this.http.post<JobResponse>(`${this.baseUrl}/recruiter/jobs`, formData);
  }

  getRecruiterJobs(): Observable<JobResponse[]> {
    return this.http.get<JobResponse[]>(`${this.baseUrl}/recruiter/jobs`);
  }

  getRecruiterJobsOverview(): Observable<JobOverviewItem[]> {
    return this.http.get<JobOverviewItem[]>(`${this.baseUrl}/recruiter/jobs-overview`);
  }

  getRecruiterCandidates(): Observable<CandidateDirectoryItem[]> {
    return this.http.get<CandidateDirectoryItem[]>(`${this.baseUrl}/recruiter/candidates`);
  }

  getRecruiterInterviewsOverview(): Observable<RecruiterInterviewsOverviewResponse> {
    return this.http.get<RecruiterInterviewsOverviewResponse>(`${this.baseUrl}/recruiter/interviews`);
  }

  submitInterviewDecision(
    jobId: string,
    matchId: string,
    payload: InterviewDecisionRequest
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/recruiter/jobs/${jobId}/matches/${matchId}/interview-decision`,
      payload
    );
  }

  saveInterviewNotes(
    jobId: string,
    matchId: string,
    payload: SaveInterviewNotesRequest
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/recruiter/jobs/${jobId}/matches/${matchId}/interview-notes`,
      payload
    );
  }

  getCandidateAppliedJobs(email?: string): Observable<CandidateApplication[]> {
    const url = email 
      ? `${this.baseUrl}/candidate/applied-jobs?email=${encodeURIComponent(email)}`
      : `${this.baseUrl}/candidate/applied-jobs`;
    return this.http.get<CandidateApplication[]>(url);
  }

  getRecruiterJob(jobId: string): Observable<JobResponse> {
    return this.http.get<JobResponse>(`${this.baseUrl}/recruiter/jobs/${jobId}`);
  }

  getJobAssessment(jobId: string): Observable<PublicSJTAssessment> {
    return this.http.get<PublicSJTAssessment>(`${this.baseUrl}/candidate/jobs/${jobId}/assessment`);
  }

  generateCustomSjt(jobId: string, requirements?: string, testCriteria?: string): Observable<any> {
    const payload: any = {};
    if (requirements) payload.requirements = requirements;
    if (testCriteria) payload.test_criteria = testCriteria;
    return this.http.post<any>(`${this.baseUrl}/recruiter/jobs/${jobId}/generate-sjt`, payload);
  }

  updateJobSjt(jobId: string, assessment: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/recruiter/jobs/${jobId}/sjt`, { assessment });
  }

  getInitialAssessment(file: File, jobId?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (jobId) {
      formData.append('job_id', jobId);
    }
    return this.http.post<any>(`${this.baseUrl}/candidate/initial-assessment`, formData);
  }

  applyToJob(
    jobId: string, 
    candidateName: string, 
    candidateEmail: string, 
    resumeFile: File,
    answers?: CandidateAnswer[]
  ): Observable<any> {
    const formData = new FormData();
    formData.append('candidate_name', candidateName);
    formData.append('candidate_email', candidateEmail);
    formData.append('resume_file', resumeFile);
    if (answers && answers.length > 0) {
      formData.append('answers_json', JSON.stringify(answers));
    }
    return this.http.post<any>(`${this.baseUrl}/candidate/jobs/${jobId}`, formData);
  }

  getJobMatches(jobId: string): Observable<CandidateMatch[]> {
    return this.http.get<CandidateMatch[]>(`${this.baseUrl}/recruiter/jobs/${jobId}/matches`);
  }

  getPublicJobs(): Observable<JobResponse[]> {
    return this.http.get<JobResponse[]>(`${this.baseUrl}/candidate/jobs`);
  }

  getPublicJobDetails(jobId: string): Observable<JobResponse> {
    return this.http.get<JobResponse>(`${this.baseUrl}/candidate/jobs/${jobId}/public`);
  }

  updateMatchStatus(
    jobId: string, 
    matchId: string, 
    status: string,
    interviewSchedule?: {
      scheduled_at?: string;
      location?: string;
      custom_message?: string;
    },
    sensitivityThreshold?: number,
    recruiterEmail?: string
  ): Observable<CandidateMatch> {
    const payload: any = { status };
    if (interviewSchedule) {
      if (interviewSchedule.scheduled_at) payload.scheduled_at = interviewSchedule.scheduled_at;
      if (interviewSchedule.location) payload.location = interviewSchedule.location;
      if (interviewSchedule.custom_message) payload.custom_message = interviewSchedule.custom_message;
    }
    if (sensitivityThreshold !== undefined && sensitivityThreshold !== null) {
      payload.sensitivity_threshold = sensitivityThreshold;
    }
    if (recruiterEmail) {
      payload.recruiter_email = recruiterEmail;
    }
    return this.http.patch<CandidateMatch>(
      `${this.baseUrl}/recruiter/jobs/${jobId}/matches/${matchId}/status`,
      payload
    );
  }

  // --- Candidate Onboarding & Profile Management ---
  candidateOnboarding(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/candidate/onboarding`, payload);
  }

  updateCandidateProfile(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/candidate/profile`, payload);
  }

  parseCandidateCv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/candidate/parse-cv`, formData);
  }

  // --- Recruiter Onboarding ---
  recruiterOnboarding(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/recruiter/onboarding`, payload);
  }

  inviteRecruiterTeam(payload: { emails: string[]; company_id: string; company_name: string; recruiter_email?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/recruiter/invite-team`, payload);
  }

  getTeamInvites(companyId?: string, recruiterEmail?: string): Observable<any[]> {
    const params = new URLSearchParams();
    if (companyId) params.set('company_id', companyId);
    if (recruiterEmail) params.set('recruiter_email', recruiterEmail);
    return this.http.get<any[]>(`${this.baseUrl}/recruiter/team-invites?${params.toString()}`);
  }

  confirmInvitePayment(inviteId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payment/confirm-invite/${encodeURIComponent(inviteId)}`, {});
  }

  // --- Recruiter Pro Subscription & Payrexx Payments ---
  getSubscriptionStatus(email?: string, userId?: string): Observable<any> {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (userId) params.set('user_id', userId);
    return this.http.get<any>(`${this.baseUrl}/auth/subscription-status?${params.toString()}`);
  }

  createSubscriptionPaylink(email: string, userId?: string, companyId?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payment/create-subscription-paylink`, {
      email,
      user_id: userId || email,
      company_id: companyId
    });
  }

  confirmSubscriptionPayment(email: string, userId?: string, paymentRef?: string, companyId?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payment/confirm-subscription`, {
      email,
      user_id: userId || email,
      payment_ref: paymentRef,
      company_id: companyId
    });
  }

  // --- Contract Offers & Commission Management ---
  createContractOffer(jobId: string, matchId: string, payload: CreateOfferRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/recruiter/jobs/${encodeURIComponent(jobId)}/matches/${encodeURIComponent(matchId)}/offer`, payload);
  }

  candidateSignOffer(matchId: string, payload: SignOfferRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/candidate/matches/${encodeURIComponent(matchId)}/offer/sign`, payload);
  }

  candidateDeclineOffer(matchId: string, payload: DeclineOfferRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/candidate/matches/${encodeURIComponent(matchId)}/offer/decline`, payload);
  }

  getManagementPlacements(): Observable<ManagementPlacementsResponse> {
    return this.http.get<ManagementPlacementsResponse>(`${this.baseUrl}/admin/placements`);
  }

  updatePlacementCommission(matchId: string, payload: UpdateCommissionRequest): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/placements/${encodeURIComponent(matchId)}/commission`, payload);
  }



  // --- Vendor Admin Management ---
  getAdminRecruiters(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/recruiters`);
  }

  provisionRecruiter(payload: { company_name: string; recruiter_email: string; plan?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/recruiters`, payload);
  }

  updateRecruiterStatus(recruiterId: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/admin/recruiters/${recruiterId}/status`, { status });
  }

  getAdminMetrics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/metrics`);
  }

  // --- Master Data ---
  searchMasterSkills(query: string, limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/master-data/skills?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
}

