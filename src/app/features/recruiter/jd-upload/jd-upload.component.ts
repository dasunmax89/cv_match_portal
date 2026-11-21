import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { 
  JobResponse, 
  AnalyzeJobDescriptionResponse, 
  SaveJobRequest,
  PreliminaryJobOrder 
} from '../../../core/models/candidate.models';
import { AutoGrowDirective } from '../../../shared/directives/auto-grow.directive';

@Component({
  selector: 'app-jd-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutoGrowDirective],
  templateUrl: './jd-upload.component.html'
})
export class JdUploadComponent {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Flow step: 'upload' -> 'review' (form review & edit) -> 'saved'
  currentStep = signal<'upload' | 'review' | 'saved'>('upload');

  isDragging = signal(false);
  isAnalyzing = signal(false);
  isSaving = signal(false);

  selectedFile = signal<File | null>(null);
  errorMessage = signal<string | null>(null);
  validationErrors = signal<string[]>([]);
  formSubmitted = signal(false);

  analyzedData = signal<AnalyzeJobDescriptionResponse | null>(null);
  savedJob = signal<JobResponse | null>(null);

  // Predefined industry / job order categories
  readonly jobCategories: string[] = [
    'General Workers in the Construction/ Factory/ Services Industry',
    'General Workers - Construction Industry',
    'General Workers - Factory / Manufacturing Industry',
    'General Workers - Services Industry (Hotels, F&B, Restaurants)',
    'General Workers - Plantation / Agriculture',
    'Construction & Building Services',
    'Manufacturing & Production',
    'Services, Hospitality & F&B',
    'Logistics, Warehousing & Distribution',
    'Information Technology & Software',
    'Healthcare & Medical Services',
    'Engineering & Maintenance',
    'Sales, Marketing & Customer Care',
    'Office Administration & Clerical',
    'Other'
  ];

  // Predefined currencies
  readonly currencies: { code: string; label: string; symbol: string }[] = [
    { code: 'RM', label: 'RM - Malaysian Ringgit', symbol: 'RM' },
    { code: 'USD', label: 'USD ($) - US Dollar', symbol: '$' },
    { code: 'EUR', label: 'EUR (€) - Euro', symbol: '€' },
    { code: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
    { code: 'GBP', label: 'GBP (£) - British Pound', symbol: '£' },
    { code: 'SGD', label: 'SGD (S$) - Singapore Dollar', symbol: 'S$' },
    { code: 'AED', label: 'AED - UAE Dirham', symbol: 'AED' },
    { code: 'SAR', label: 'SAR - Saudi Riyal', symbol: 'SAR' },
    { code: 'QAR', label: 'QAR - Qatari Riyal', symbol: 'QAR' },
    { code: 'JPY', label: 'JPY (¥) - Japanese Yen', symbol: '¥' },
    { code: 'INR', label: 'INR (₹) - Indian Rupee', symbol: '₹' },
    { code: 'LKR', label: 'LKR (Rs) - Sri Lankan Rupee', symbol: 'Rs' }
  ];

  // Initial upload form
  uploadForm = this.fb.group({
    title: ['']
  });

  // Preliminary Job Order & Requisition Review Form (Autofilled & Mandatory)
  orderForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    job_category: ['', [Validators.required]],
    custom_category: [''],
    job_description: ['', [Validators.required, Validators.minLength(10)]],
    total_approved_quantity: [200, [Validators.required, Validators.min(1)]],
    minimum_qualifications: ['', [Validators.required]],
    monthly_salary: [2000, [Validators.required, Validators.min(0)]],
    salary_currency: ['RM', [Validators.required]],
    regular_work_hours: ['', [Validators.required]],
    contract_period: ['', [Validators.required]],
    other_employee_benefits: ['', [Validators.required]]
  });

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    this.errorMessage.set(null);
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      this.errorMessage.set('Please upload a valid PDF file.');
      return;
    }
    this.selectedFile.set(file);
  }

  analyze() {
    this.errorMessage.set(null);
    this.validationErrors.set([]);

    if (!this.selectedFile()) {
      this.errorMessage.set('Please select or drop a PDF file to analyze.');
      return;
    }

    const title = this.uploadForm.value.title?.trim();
    this.isAnalyzing.set(true);

    this.apiService.analyzeJd(title, this.selectedFile()!).subscribe({
      next: (res) => {
        this.analyzedData.set(res);
        this.isAnalyzing.set(false);

        // Autofill the Preliminary Job Order Form
        const prelim = res.preliminary_job_order;
        const initialCategory = prelim?.job_category || 'General Workers in the Construction/ Factory/ Services Industry';
        const isPredefinedCat = this.jobCategories.includes(initialCategory);

        this.orderForm.patchValue({
          title: res.title || '',
          job_category: isPredefinedCat ? initialCategory : 'Other',
          custom_category: isPredefinedCat ? '' : initialCategory,
          job_description: prelim?.job_description || '',
          total_approved_quantity: prelim?.total_approved_quantity || 200,
          minimum_qualifications: prelim?.minimum_qualifications || '',
          monthly_salary: prelim?.monthly_salary ?? 2000,
          salary_currency: prelim?.salary_currency || 'RM',
          regular_work_hours: prelim?.regular_work_hours || 'Maximum of 8 hours per day, and up to 48 hours per week.',
          contract_period: prelim?.contract_period || 'Minimum of one(1) year, with annual renewal.',
          other_employee_benefits: prelim?.other_employee_benefits || ''
        });

        this.formSubmitted.set(false);
        this.currentStep.set('review');
      },
      error: (err) => {
        console.error('JD Analysis failed', err);
        const detail = err?.error?.detail || err?.message || 'Failed to process Job Description with AI.';
        this.errorMessage.set(detail);
        this.isAnalyzing.set(false);
      }
    });
  }

  saveJob() {
    this.formSubmitted.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set([]);

    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      const errors: string[] = [];

      const val = this.orderForm.value;
      if (!val.title || val.title.trim().length < 2) {
        errors.push('Job Title is mandatory.');
      }
      if (!val.job_category) {
        errors.push('Job Category dropdown selection is mandatory.');
      } else if (val.job_category === 'Other' && (!val.custom_category || !val.custom_category.trim())) {
        errors.push('Please specify custom Job Category.');
      }
      if (!val.job_description || val.job_description.trim().length < 10) {
        errors.push('Job Description is mandatory (at least 10 characters).');
      }
      if (val.total_approved_quantity == null || val.total_approved_quantity < 1) {
        errors.push('Total Approved Quantity must be at least 1 headcount.');
      }
      if (!val.minimum_qualifications || !val.minimum_qualifications.trim()) {
        errors.push('Minimum Qualifications field is mandatory.');
      }
      if (val.monthly_salary == null || val.monthly_salary < 0) {
        errors.push('Monthly Salary must be a valid positive number.');
      }
      if (!val.salary_currency) {
        errors.push('Salary Currency selection is mandatory.');
      }
      if (!val.regular_work_hours || !val.regular_work_hours.trim()) {
        errors.push('Regular Work Hours field is mandatory.');
      }
      if (!val.contract_period || !val.contract_period.trim()) {
        errors.push('Contract Period field is mandatory.');
      }
      if (!val.other_employee_benefits || !val.other_employee_benefits.trim()) {
        errors.push('Other Employee Benefits field is mandatory.');
      }

      this.validationErrors.set(errors);
      this.errorMessage.set('Please fill all mandatory Preliminary Job Order fields before saving.');
      return;
    }

    const formVal = this.orderForm.getRawValue();
    const finalCategory = (formVal.job_category === 'Other' && formVal.custom_category?.trim())
      ? formVal.custom_category.trim()
      : formVal.job_category!.trim();

    const preliminaryOrder: PreliminaryJobOrder = {
      job_category: finalCategory,
      job_description: formVal.job_description!.trim(),
      total_approved_quantity: Number(formVal.total_approved_quantity),
      minimum_qualifications: formVal.minimum_qualifications!.trim(),
      monthly_salary: Number(formVal.monthly_salary),
      salary_currency: formVal.salary_currency!.trim(),
      regular_work_hours: formVal.regular_work_hours!.trim(),
      contract_period: formVal.contract_period!.trim(),
      other_employee_benefits: formVal.other_employee_benefits!.trim()
    };

    const payload: SaveJobRequest = {
      title: formVal.title!.trim(),
      preliminary_job_order: preliminaryOrder,
      criteria: this.analyzedData()?.criteria,
      assessment: this.analyzedData()?.assessment
    };

    this.isSaving.set(true);

    this.apiService.saveJob(payload).subscribe({
      next: (res) => {
        this.savedJob.set(res);
        this.isSaving.set(false);
        this.currentStep.set('saved');
      },
      error: (err) => {
        console.error('Saving job failed', err);
        const detail = err?.error?.detail || err?.message || 'Failed to save Job Requisition.';
        this.errorMessage.set(detail);
        this.isSaving.set(false);
      }
    });
  }

  editCurrentOrder() {
    this.currentStep.set('review');
  }

  startOver() {
    this.selectedFile.set(null);
    this.analyzedData.set(null);
    this.savedJob.set(null);
    this.errorMessage.set(null);
    this.validationErrors.set([]);
    this.formSubmitted.set(false);
    this.uploadForm.reset();
    this.orderForm.reset({
      total_approved_quantity: 200,
      monthly_salary: 2000,
      salary_currency: 'RM'
    });
    this.currentStep.set('upload');
  }

  publishJob() {
    this.router.navigate(['/recruiter/jobs']);
  }

  viewJobCandidates() {
    const jobId = this.savedJob()?.id;
    if (jobId) {
      this.router.navigate(['/recruiter/jobs', jobId]);
    } else {
      this.router.navigate(['/recruiter/jobs']);
    }
  }
}
