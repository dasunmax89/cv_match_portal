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
    return !!this.candidateUser() && !!this.getToken();
  }

  hasCandidateProfile(): boolean {
    const user = this.candidateUser();
    return !!(user && (user.hasSetupProfile || user.initialAssessment || (user.skills && user.skills.length > 0)));
  }

  loginCandidate(user: any) {
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
    const token = user?.token || user?.access_token || existingToken;
    if (token) {
      user.token = token;
      user.access_token = token;
      if (typeof window !== 'undefined') localStorage.setItem('portal_token', token);
    }
    this.candidateUser.set(user);
    if (typeof window !== 'undefined') localStorage.setItem('candidate_user', JSON.stringify(user));
  }

  logoutCandidate() {
    this.candidateUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('candidate_user');
      localStorage.removeItem('portal_token');
    }
    this.router.navigate(['/candidate/login']);
  }

  // --- Recruiter Auth ---
  isRecruiterLoggedIn(): boolean {
    return !!this.recruiterUser() && !!this.getToken();
  }

  loginRecruiter(user: any) {
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
    const token = user?.token || user?.access_token || existingToken;
    if (token) {
      user.token = token;
      user.access_token = token;
      if (typeof window !== 'undefined') localStorage.setItem('portal_token', token);
    }
    this.recruiterUser.set(user);
    if (typeof window !== 'undefined') localStorage.setItem('recruiter_user', JSON.stringify(user));
  }

  updateRecruiterSubscription(sub: any) {
    const current = this.recruiterUser();
    if (current) {
      const updated = { ...current, subscription: sub };
      this.loginRecruiter(updated);
    }
  }

  isTrial(): boolean {
    const sub = this.recruiterUser()?.subscription;
    return !!(sub && sub.isTrial && sub.status === 'Active');
  }

  isPaymentDone(): boolean {
    const sub = this.recruiterUser()?.subscription;
    return !!(sub && sub.paymentDone);
  }

  isTrialExpired(): boolean {
    const sub = this.recruiterUser()?.subscription;
    return !!(sub && (sub.status === 'Expired' || (sub.daysRemaining <= 0 && !sub.paymentDone)));
  }

  trialDaysRemaining(): number {
    const sub = this.recruiterUser()?.subscription;
    return sub?.daysRemaining ?? 30;
  }

  logoutRecruiter() {
    this.recruiterUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recruiter_user');
      localStorage.removeItem('portal_token');
    }
    this.router.navigate(['/recruiter/login']);
  }

  // --- Management / Admin Auth ---
  isManagementLoggedIn(): boolean {
    return !!this.managementUser() && !!this.getToken();
  }

  loginManagement(user: any) {
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
    const token = user?.token || user?.access_token || existingToken;
    if (token) {
      user.token = token;
      user.access_token = token;
      if (typeof window !== 'undefined') localStorage.setItem('portal_token', token);
    }
    this.managementUser.set(user);
    if (typeof window !== 'undefined') localStorage.setItem('management_user', JSON.stringify(user));
  }

  logoutManagement() {
    this.managementUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('management_user');
      localStorage.removeItem('portal_token');
    }
    this.router.navigate(['/management/login']);
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const directToken = localStorage.getItem('portal_token');
    if (directToken) return directToken;

    try {
      const r = this.getStoredUser('recruiter_user');
      if (r?.token || r?.access_token) return r.token || r.access_token;
    } catch {}

    try {
      const c = this.getStoredUser('candidate_user');
      if (c?.token || c?.access_token) return c.token || c.access_token;
    } catch {}

    try {
      const m = this.getStoredUser('management_user');
      if (m?.token || m?.access_token) return m.token || m.access_token;
    } catch {}

    return null;
  }
}
