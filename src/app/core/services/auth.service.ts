import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  // Signals for Auth States
  candidateUser = signal<any>(this.getStoredUser('candidate_user'));
  recruiterUser = signal<any>(this.getStoredUser('recruiter_user'));
  managementUser = signal<any>(this.getStoredUser('management_user'));

  private getStoredUser(key: string): any {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // --- Candidate Auth ---
  isCandidateLoggedIn(): boolean {
    return !!this.candidateUser();
  }

  hasCandidateProfile(): boolean {
    const user = this.candidateUser();
    return !!(user && (user.hasSetupProfile || user.initialAssessment || (user.skills && user.skills.length > 0)));
  }

  loginCandidate(user: any) {
    this.candidateUser.set(user);
    localStorage.setItem('candidate_user', JSON.stringify(user));
  }

  logoutCandidate() {
    this.candidateUser.set(null);
    localStorage.removeItem('candidate_user');
    this.router.navigate(['/candidate/login']);
  }

  // --- Recruiter Auth ---
  isRecruiterLoggedIn(): boolean {
    return !!this.recruiterUser();
  }

  loginRecruiter(user: any) {
    this.recruiterUser.set(user);
    localStorage.setItem('recruiter_user', JSON.stringify(user));
  }

  logoutRecruiter() {
    this.recruiterUser.set(null);
    localStorage.removeItem('recruiter_user');
    this.router.navigate(['/recruiter/login']);
  }

  // --- Management / Admin Auth ---
  isManagementLoggedIn(): boolean {
    return !!this.managementUser();
  }

  loginManagement(user: any) {
    this.managementUser.set(user);
    localStorage.setItem('management_user', JSON.stringify(user));
  }

  logoutManagement() {
    this.managementUser.set(null);
    localStorage.removeItem('management_user');
    this.router.navigate(['/management/login']);
  }
}
