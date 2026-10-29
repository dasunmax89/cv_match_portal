import { Component, Input, Output, EventEmitter, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  ContractOffer, 
  CreateOfferRequest, 
  POPULAR_CURRENCIES, 
  CurrencyOption 
} from '../../../core/models/candidate.models';

@Component({
  selector: 'app-offer-draft-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offer-draft-modal.component.html'
})
export class OfferDraftModalComponent implements OnChanges {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  @Input({ required: true }) jobId!: string;
  @Input({ required: true }) matchId!: string;
  @Input({ required: true }) candidateName!: string;
  @Input() candidateEmail?: string;
  @Input() jobTitle?: string;
  @Input() seniorityLevel?: string;
  @Input() companyName?: string;
  @Input() existingOffer?: ContractOffer | null;
  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ match: any; isDraft: boolean }>();

  // Tabs: 'terms' (edit fields) vs 'preview' (formal contract document)
  activeTab = signal<'terms' | 'preview'>('terms');

  popularCurrencies: CurrencyOption[] = POPULAR_CURRENCIES;

  // Form Signals
  offerSalary = signal<number>(120000);
  offerCurrency = signal<string>('CHF');
  offerBonus = signal<number>(0);
  offerStartDate = signal<string>('');
  offerContractType = signal<string>('Full-Time Permanent');
  offerProbationMonths = signal<number>(3);
  offerCompanyCc = signal<string>('');
  offerNotes = signal<string>('');
  offerCommissionRate = signal<number>(10.0);
  agreeToCommissionTerms = signal<boolean>(true);

  // Status & Feedback
  isSubmitting = signal<boolean>(false);
  submittingMode = signal<'draft' | 'dispatch' | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Live Commission Calculation
  offerCommissionAmount = computed(() => {
    const sal = Number(this.offerSalary()) || 0;
    const rate = Number(this.offerCommissionRate()) || 10.0;
    return Math.round(sal * (rate / 100.0));
  });

  totalPackageValue = computed(() => {
    const sal = Number(this.offerSalary()) || 0;
    const bonus = Number(this.offerBonus()) || 0;
    return sal + bonus;
  });

  todayDateFormatted = computed(() => {
    return new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initForm();
    }
  }

  initForm(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(false);
    this.submittingMode.set(null);
    this.activeTab.set('terms');

    if (this.existingOffer) {
      this.offerSalary.set(this.existingOffer.annual_base_salary || 120000);
      this.offerCurrency.set(this.existingOffer.currency || 'CHF');
      this.offerBonus.set(this.existingOffer.bonus_or_allowances || 0);
      this.offerStartDate.set(this.existingOffer.start_date || '');
      this.offerContractType.set(this.existingOffer.contract_type || 'Full-Time Permanent');
      this.offerProbationMonths.set(this.existingOffer.probation_period_months ?? 3);
      this.offerCompanyCc.set(this.existingOffer.company_cc_email || '');
      this.offerNotes.set(this.existingOffer.notes_or_terms || '');
      this.offerCommissionRate.set(this.existingOffer.commission_rate_percent || 10.0);
    } else {
      this.offerSalary.set(120000);
      this.offerCurrency.set('CHF');
      this.offerBonus.set(0);

      // Default start date: +3 weeks from today
      const d = new Date();
      d.setDate(d.getDate() + 21);
      this.offerStartDate.set(d.toISOString().slice(0, 10));

      this.offerContractType.set('Full-Time Permanent');
      this.offerProbationMonths.set(3);
      this.offerCompanyCc.set('');
      this.offerNotes.set('Standard onboarding and company benefits package applicable. Welcome to the team!');
      this.offerCommissionRate.set(10.0);
    }

    this.agreeToCommissionTerms.set(true);
  }

  handleClose(): void {
    this.close.emit();
  }

  getCurrencySymbol(code: string): string {
    const found = this.popularCurrencies.find(c => c.code === (code || '').toUpperCase());
    return found ? found.symbol : (code || 'CHF');
  }

  formatCurrency(val?: number, currencyCode: string = 'CHF'): string {
    if (val === undefined || val === null) return '-';
    const sym = this.getCurrencySymbol(currencyCode);
    return `${sym} ${val.toLocaleString()}`;
  }

  validateForm(): boolean {
    const sal = Number(this.offerSalary());
    if (!sal || sal <= 0) {
      this.errorMessage.set('Please enter a valid annual base salary.');
      return false;
    }

    if (!this.offerStartDate()) {
      this.errorMessage.set('Please select an agreed target start date.');
      return false;
    }

    const cc = (this.offerCompanyCc() || '').trim();
    if (cc && !cc.includes('@')) {
      this.errorMessage.set('Please enter a valid company CC email address (or leave it blank).');
      return false;
    }

    if (!this.agreeToCommissionTerms()) {
      this.errorMessage.set('Please confirm acceptance of Magic Match placement commission terms.');
      return false;
    }

    return true;
  }

  saveDraft(): void {
    if (!this.validateForm()) return;

    this.isSubmitting.set(true);
    this.submittingMode.set('draft');
    this.errorMessage.set(null);

    const user = this.authService.recruiterUser();
    const cc = (this.offerCompanyCc() || '').trim();

    const payload: CreateOfferRequest = {
      annual_base_salary: Number(this.offerSalary()),
      currency: this.offerCurrency(),
      bonus_or_allowances: Number(this.offerBonus()) || 0,
      start_date: this.offerStartDate(),
      contract_type: this.offerContractType(),
      probation_period_months: Number(this.offerProbationMonths()) || 3,
      notes_or_terms: (this.offerNotes() || '').trim() || undefined,
      company_cc_email: cc || undefined,
      commission_rate_percent: Number(this.offerCommissionRate()) || 10.0,
      recruiter_email: user?.workEmail || user?.email || undefined,
      is_draft: true
    };

    this.apiService.createContractOffer(this.jobId, this.matchId, payload).subscribe({
      next: (updatedMatch) => {
        this.isSubmitting.set(false);
        this.submittingMode.set(null);
        this.successMessage.set(`✓ Offer drafted successfully for ${this.candidateName}! Candidate status set to 'Offer Drafting'.`);
        this.saved.emit({ match: updatedMatch, isDraft: true });

        setTimeout(() => {
          this.handleClose();
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submittingMode.set(null);
        console.error('Failed to save offer draft', err);
        this.errorMessage.set(err?.error?.detail || err?.message || 'Failed to save offer draft. Please check inputs.');
      }
    });
  }

  dispatchOffer(): void {
    if (!this.validateForm()) return;

    this.isSubmitting.set(true);
    this.submittingMode.set('dispatch');
    this.errorMessage.set(null);

    const user = this.authService.recruiterUser();
    const cc = (this.offerCompanyCc() || '').trim();

    const payload: CreateOfferRequest = {
      annual_base_salary: Number(this.offerSalary()),
      currency: this.offerCurrency(),
      bonus_or_allowances: Number(this.offerBonus()) || 0,
      start_date: this.offerStartDate(),
      contract_type: this.offerContractType(),
      probation_period_months: Number(this.offerProbationMonths()) || 3,
      notes_or_terms: (this.offerNotes() || '').trim() || undefined,
      company_cc_email: cc || undefined,
      commission_rate_percent: Number(this.offerCommissionRate()) || 10.0,
      recruiter_email: user?.workEmail || user?.email || undefined,
      is_draft: false
    };

    this.apiService.createContractOffer(this.jobId, this.matchId, payload).subscribe({
      next: (updatedMatch) => {
        this.isSubmitting.set(false);
        this.submittingMode.set(null);
        const ccInfo = cc ? ` (with CC to ${cc})` : '';
        this.successMessage.set(`🎉 Contract offer dispatched to ${this.candidateName}! Candidate notified for digital signature${ccInfo}.`);
        this.saved.emit({ match: updatedMatch, isDraft: false });

        setTimeout(() => {
          this.handleClose();
        }, 1800);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submittingMode.set(null);
        console.error('Failed to dispatch contract offer', err);
        this.errorMessage.set(err?.error?.detail || err?.message || 'Failed to dispatch offer. Please check details and try again.');
      }
    });
  }

  printContractPreview(): void {
    window.print();
  }
}
