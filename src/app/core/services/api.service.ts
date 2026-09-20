import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ParsedCriteria, CandidateMatch, JobResponse, PublicSJTAssessment, CandidateAnswer } from '../models/candidate.models';
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
    logoData?: string | null;
  }): Observable<any> {
    const rawPass = data.password || '';
    return from(hashPasswordClient(rawPass)).pipe(
      switchMap(passwordHash =>
        this.http.post(`${this.baseUrl}/auth/signup/company`, {
          company_name: data.companyName,
          website: data.website,
          industry: data.industry,
          tagline: data.tagline,
          email: data.email,
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

  authenticateUser(payload: { username: string; password_hash: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/authenticate`, payload);
  }

  submitJob(jobType: string, payload: any = {}, file?: File, userId: string = 'anonymous'): Observable<any> {
    const formData = new FormData();
    formData.append('job_type', jobType);
    formData.append('payload_json', JSON.stringify(payload));
    formData.append('user_id', userId);
    if (file) {
      formData.append('file', file);
    }
    return this.http.post(`${this.baseUrl}/jobs/submit`, formData);
  }

  getJobStatus(jobId: string, userId: string = 'anonymous'): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/${jobId}?user_id=${userId}`);
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

  updateMatchStatus(jobId: string, matchId: string, status: string): Observable<CandidateMatch> {
    return this.http.patch<CandidateMatch>(
      `${this.baseUrl}/recruiter/jobs/${jobId}/matches/${matchId}/status`,
      { status }
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

