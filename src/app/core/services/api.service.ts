import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParsedCriteria, CandidateMatch, JobResponse } from '../models/candidate.models';


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

  login(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login?email=${encodeURIComponent(email)}`, {});
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

  uploadJd(title: string, file: File): Observable<JobResponse> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    return this.http.post<JobResponse>(`${this.baseUrl}/recruiter/jobs`, formData);
  }

  applyToJob(jobId: string, candidateName: string, candidateEmail: string, resumeFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('candidate_name', candidateName);
    formData.append('candidate_email', candidateEmail);
    formData.append('resume_file', resumeFile);
    return this.http.post<any>(`${this.baseUrl}/apply/jobs/${jobId}`, formData);
  }

  getJobMatches(jobId: string): Observable<CandidateMatch[]> {
    return this.http.get<CandidateMatch[]>(`${this.baseUrl}/recruiter/jobs/${jobId}/matches`);
  }

  getPublicJobs(): Observable<JobResponse[]> {
    return this.http.get<JobResponse[]>(`${this.baseUrl}/apply/jobs`);
  }

  getPublicJobDetails(jobId: string): Observable<JobResponse> {
    return this.http.get<JobResponse>(`${this.baseUrl}/apply/jobs/${jobId}/public`);
  }

  updateMatchStatus(jobId: string, matchId: string, status: string): Observable<CandidateMatch> {
    return this.http.patch<CandidateMatch>(
      `${this.baseUrl}/recruiter/jobs/${jobId}/matches/${matchId}/status`,
      { status }
    );
  }
}
