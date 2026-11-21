import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { JdUploadComponent } from './jd-upload.component';
import { ApiService } from '../../../core/services/api.service';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('JdUploadComponent', () => {
  let component: JdUploadComponent;
  let fixture: ComponentFixture<JdUploadComponent>;
  let mockApiService: any;

  beforeEach(async () => {
    mockApiService = {
      analyzeJd: () => of({
        title: 'General Construction Worker',
        criteria: {
          title: 'General Construction Worker',
          seniority_level: 'Entry',
          required_skills: ['Safety Compliance'],
          nice_to_have_skills: [],
          minimum_years_experience: 0,
          core_responsibilities: ['Site preparation']
        },
        preliminary_job_order: {
          job_category: 'General Workers in the Construction/ Factory/ Services Industry',
          job_description: 'Site duties and tasks',
          total_approved_quantity: 200,
          minimum_qualifications: 'Not Applicable, since no technical expertise is required.',
          monthly_salary: 2000,
          salary_currency: 'RM',
          regular_work_hours: 'Maximum of 8 hours per day, and up to 48 hours per week.',
          contract_period: 'Minimum of one(1) year, with annual renewal.',
          other_employee_benefits: 'Insurance, Accommodation and Transportation will be provided.'
        }
      }),
      saveJob: () => of({
        id: 'job_123',
        title: 'General Construction Worker',
        criteria: {},
        preliminary_job_order: {}
      })
    };

    await TestBed.configureTestingModule({
      imports: [JdUploadComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JdUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize in upload step', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep()).toBe('upload');
  });

  it('should enforce mandatory validation before saving job', () => {
    component.currentStep.set('review');
    component.orderForm.reset();
    expect(component.orderForm.valid).toBe(false);

    component.saveJob();
    expect(component.formSubmitted()).toBe(true);
    expect(component.validationErrors().length).toBeGreaterThan(0);
    expect(component.currentStep()).toBe('review');
  });

  it('should accept valid preliminary job order and proceed to save', () => {
    component.currentStep.set('review');
    component.orderForm.setValue({
      title: 'General Worker',
      job_category: 'General Workers in the Construction/ Factory/ Services Industry',
      custom_category: '',
      job_description: 'Full duties extracted from JD document.',
      total_approved_quantity: 200,
      minimum_qualifications: 'Not Applicable, since no technical expertise is required.',
      monthly_salary: 2000,
      salary_currency: 'RM',
      regular_work_hours: 'Maximum of 8 hours per day, and up to 48 hours per week.',
      contract_period: 'Minimum of one(1) year, with annual renewal.',
      other_employee_benefits: 'Insurance, Accommodation and Transportation will be provided.'
    });

    expect(component.orderForm.valid).toBe(true);
    component.saveJob();
    expect(component.currentStep()).toBe('saved');
    expect(component.savedJob()).toBeTruthy();
  });
});
