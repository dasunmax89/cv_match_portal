import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface RecruiterAccount {
  id: string;
  company_name: string;
  recruiter_email: string;
  plan: string;
  status: string;
  active_jobs: number;
  total_matches: number;
}

@Component({
  selector: 'app-management-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class Dashboard implements OnInit {
  private apiService = inject(ApiService);

  searchQuery = '';
  accounts: RecruiterAccount[] = [];
  metrics = {
    total_recruiters: 128,
    total_candidates: 4850,
    matches_computed: 18420,
    system_status: 'Healthy'
  };

  // Provisioning Modal State
  showProvisionModal = false;
  newCompanyName = '';
  newRecruiterEmail = '';
  newPlan = 'Enterprise';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getAdminRecruiters().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.accounts = res;
        }
      }
    });

    this.apiService.getAdminMetrics().subscribe({
      next: (m) => {
        if (m) this.metrics = m;
      }
    });
  }

  get filteredAccounts() {
    if (!this.searchQuery.trim()) {
      return this.accounts;
    }
    const q = this.searchQuery.toLowerCase();
    return this.accounts.filter(a => 
      a.company_name.toLowerCase().includes(q) || 
      a.recruiter_email.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }

  errorMessage = '';

  toggleStatus(acc: RecruiterAccount) {
    const newStatus = acc.status === 'Active' ? 'Suspended' : 'Active';
    this.apiService.updateRecruiterStatus(acc.id, newStatus).subscribe({
      next: (updated) => {
        if (updated) {
          acc.status = updated.status;
        } else {
          acc.status = newStatus;
        }
      },
      error: (err) => {
        alert(err?.error?.detail || 'Failed to update recruiter status.');
      }
    });
  }

  openProvisionModal() {
    this.showProvisionModal = true;
    this.errorMessage = '';
  }

  closeProvisionModal() {
    this.showProvisionModal = false;
    this.newCompanyName = '';
    this.newRecruiterEmail = '';
    this.errorMessage = '';
  }

  submitProvisioning() {
    if (!this.newCompanyName || !this.newRecruiterEmail) {
      this.errorMessage = 'Company name and recruiter email are required.';
      return;
    }

    this.errorMessage = '';

    this.apiService.provisionRecruiter({
      company_name: this.newCompanyName,
      recruiter_email: this.newRecruiterEmail,
      plan: this.newPlan
    }).subscribe({
      next: (newAcc) => {
        this.accounts.unshift(newAcc);
        this.metrics.total_recruiters++;
        this.closeProvisionModal();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || err?.message || 'Failed to provision recruiter account. Please check details and try again.';
      }
    });
  }
}
