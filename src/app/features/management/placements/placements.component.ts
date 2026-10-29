import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import {
  PlacementOverviewItem,
  ManagementPlacementsResponse,
  UpdateCommissionRequest,
  POPULAR_CURRENCIES
} from '../../../core/models/candidate.models';

@Component({
  selector: 'app-management-placements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './placements.component.html'
})
export class ManagementPlacementsComponent implements OnInit {
  private apiService = inject(ApiService);

  isLoading = signal<boolean>(true);
  isUpdating = signal<boolean>(false);
  data = signal<ManagementPlacementsResponse | null>(null);

  searchQuery = signal<string>('');
  filterOfferStatus = signal<string>('all');
  filterCommissionStatus = signal<string>('all');

  // Invoice / Commission Status Modal
  selectedPlacementForInvoice = signal<PlacementOverviewItem | null>(null);
  invoiceStatusInput = signal<'Pending' | 'Invoiced' | 'Paid'>('Invoiced');
  invoiceRefInput = signal<string>('');
  invoiceNotesInput = signal<string>('');
  actionError = signal<string | null>(null);
  actionSuccess = signal<string | null>(null);

  popularCurrencies = POPULAR_CURRENCIES;

  ngOnInit() {
    this.loadPlacements();
  }

  loadPlacements() {
    this.isLoading.set(true);
    this.apiService.getManagementPlacements().subscribe({
      next: (res) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load management placements:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredPlacements = computed(() => {
    const list = this.data()?.placements || [];
    const q = this.searchQuery().toLowerCase().trim();
    const offerFilter = this.filterOfferStatus();
    const commFilter = this.filterCommissionStatus();

    return list.filter(item => {
      const candidateName = (item.candidateName || item.candidate_name || '').toLowerCase();
      const candidateEmail = (item.candidateEmail || item.candidate_email || '').toLowerCase();
      const jobTitle = (item.jobTitle || item.job_title || '').toLowerCase();
      const jobId = (item.jobId || item.job_id || '').toLowerCase();
      const companyCc = (item.companyCcEmail || item.company_cc_email || '').toLowerCase();
      const recruiterEmail = (item.recruiterEmail || item.recruiter_email || '').toLowerCase();

      const matchesSearch = !q || (
        candidateName.includes(q) ||
        candidateEmail.includes(q) ||
        jobTitle.includes(q) ||
        jobId.includes(q) ||
        companyCc.includes(q) ||
        recruiterEmail.includes(q)
      );
      if (!matchesSearch) return false;

      const offerStatus = (item.offerStatus || item.offer_status || '').toLowerCase();
      if (offerFilter !== 'all' && offerStatus !== offerFilter.toLowerCase()) {
        return false;
      }

      const commissionStatus = (item.commissionStatus || item.commission_status || '').toLowerCase();
      if (commFilter !== 'all' && commissionStatus !== commFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  });

  signedCount = computed(() => {
    const list = this.data()?.placements || [];
    return list.filter(p => (p.offerStatus || p.offer_status) === 'Accepted').length;
  });

  pendingOffersCount = computed(() => {
    const list = this.data()?.placements || [];
    return list.filter(p => (p.offerStatus || p.offer_status) === 'Offered').length;
  });

  totalCommissionEstimated = computed(() => {
    const list = this.data()?.placements || [];
    return list.reduce((acc, cur) => acc + (cur.commissionAmount ?? cur.commission_amount ?? 0), 0);
  });

  totalCommissionPaid = computed(() => {
    const list = this.data()?.placements || [];
    return list
      .filter(p => (p.commissionStatus || p.commission_status) === 'Paid')
      .reduce((acc, cur) => acc + (cur.commissionAmount ?? cur.commission_amount ?? 0), 0);
  });

  openInvoiceModal(item: PlacementOverviewItem) {
    this.selectedPlacementForInvoice.set(item);
    this.invoiceStatusInput.set(((item.commissionStatus || item.commission_status) as any) || 'Pending');
    this.invoiceRefInput.set(item.invoiceReferenceId || item.invoice_reference || '');
    this.invoiceNotesInput.set(item.notes || '');
    this.actionError.set(null);
    this.actionSuccess.set(null);
  }

  closeInvoiceModal() {
    this.selectedPlacementForInvoice.set(null);
    this.actionError.set(null);
    this.actionSuccess.set(null);
  }

  saveCommissionStatus() {
    const item = this.selectedPlacementForInvoice();
    if (!item) return;

    const targetMatchId = item.matchId || item.match_id;
    if (!targetMatchId) return;

    this.isUpdating.set(true);
    this.actionError.set(null);

    const payload: UpdateCommissionRequest = {
      commission_status: this.invoiceStatusInput(),
      invoice_reference_id: this.invoiceRefInput().trim() || undefined,
      invoice_reference: this.invoiceRefInput().trim() || undefined,
      notes: this.invoiceNotesInput().trim() || undefined
    };

    this.apiService.updatePlacementCommission(targetMatchId, payload).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        this.actionSuccess.set('Commission invoice status successfully updated!');

        // Update local item
        const curData = this.data();
        if (curData) {
          const updatedPlacements = curData.placements.map(p => {
            const pId = p.matchId || p.match_id;
            if (pId === targetMatchId) {
              return {
                ...p,
                commissionStatus: res.commission_status,
                commission_status: res.commission_status as any,
                invoiceReferenceId: res.invoice_reference,
                invoice_reference: res.invoice_reference,
                notes: res.notes
              };
            }
            return p;
          });
          this.data.set({
            ...curData,
            placements: updatedPlacements
          });
        }

        setTimeout(() => {
          this.closeInvoiceModal();
        }, 1200);
      },
      error: (err) => {
        this.isUpdating.set(false);
        console.error('Failed to update commission status:', err);
        this.actionError.set(err?.error?.detail || 'Failed to update commission record. Please try again.');
      }
    });
  }

  getCurrencySymbol(code?: string): string {
    const found = this.popularCurrencies.find(c => c.code === (code || '').toUpperCase());
    return found ? found.symbol : (code || 'CHF');
  }

  formatCurrency(val?: number, currencyCode: string = 'CHF'): string {
    if (val === undefined || val === null) return '-';
    const sym = this.getCurrencySymbol(currencyCode);
    return `${sym} ${val.toLocaleString()}`;
  }

  getOfferStatusBadge(status?: string): { label: string; css: string } {
    switch ((status || '').toLowerCase()) {
      case 'accepted':
        return { label: '✓ Contract Signed', css: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'offered':
        return { label: '⏳ Offer Pending', css: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'declined':
        return { label: '✕ Declined', css: 'bg-rose-50 text-rose-800 border-rose-300' };
      default:
        return { label: status || 'Unknown', css: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  }

  getCommissionStatusBadge(status?: string): { label: string; css: string } {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return { label: '✓ Commission Paid', css: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' };
      case 'invoiced':
        return { label: '📋 Invoiced (Net 30)', css: 'bg-sky-50 text-sky-800 border-sky-300 font-bold' };
      default:
        return { label: '⏳ Pending Invoice', css: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' };
    }
  }
}
