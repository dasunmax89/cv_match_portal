import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PublicSJTAssessment, CandidateAnswer } from '../../../core/models/candidate.models';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './apply.component.html'
})
export class ApplyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);

  jobId = signal<string>('');
  isDragging = signal(false);
  selectedFile = signal<File | null>(null);
  
  // Stage & Assessment Signals
  step = signal<number>(1);
  loadingAssessment = signal<boolean>(false);
  assessment = signal<PublicSJTAssessment | null>(null);
  candidateAnswers = signal<Record<string, string>>({});

  // Initial AI Assessment Signal
  loadingInitialAssessment = signal<boolean>(false);
  initialAssessment = signal<any>(null);

  // States: 'idle' | 'submitting' | 'success' | 'error'
  submitState = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  applyForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId.set(id);
    }
  }

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
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.');
      return;
    }
    this.selectedFile.set(file);

    // Call apiService.getInitialAssessment() to parse CV & save in Cosmos DB 'initial_assessments'
    this.loadingInitialAssessment.set(true);
    this.apiService.getInitialAssessment(file, this.jobId()).subscribe({
      next: (assessmentData) => {
        this.loadingInitialAssessment.set(false);
        this.initialAssessment.set(assessmentData);
        // Pre-fill extracted details if form is empty
        if (assessmentData.full_name && assessmentData.full_name !== 'Candidate' && !this.applyForm.value.fullName) {
          this.applyForm.patchValue({ fullName: assessmentData.full_name });
        }
        if (assessmentData.email && !this.applyForm.value.email) {
          this.applyForm.patchValue({ email: assessmentData.email });
        }
      },
      error: () => {
        this.loadingInitialAssessment.set(false);
      }
    });
  }

  proceedToAssessment() {
    if (this.applyForm.invalid || !this.selectedFile()) {
      alert('Please fill out all required fields and attach your resume.');
      return;
    }

    this.loadingAssessment.set(true);
    this.apiService.getJobAssessment(this.jobId()).subscribe({
      next: (data) => {
        this.loadingAssessment.set(false);
        if (data && data.questions && data.questions.length > 0) {
          this.assessment.set(data);
          this.step.set(2);
        } else {
          this.submitFinalApplication();
        }
      },
      error: () => {
        // Fallback: If no assessment questions exist for job, directly submit application
        this.loadingAssessment.set(false);
        this.submitFinalApplication();
      }
    });
  }

  selectOption(questionId: string, selectedKey: string) {
    const current = { ...this.candidateAnswers() };
    current[questionId] = selectedKey;
    this.candidateAnswers.set(current);
  }

  isAllQuestionsAnswered(): boolean {
    const questions = this.assessment()?.questions || [];
    const answers = this.candidateAnswers();
    return questions.length > 0 && questions.every(q => !!answers[q.id]);
  }

  answeredCount(): number {
    return Object.keys(this.candidateAnswers()).length;
  }

  submitFinalApplication() {
    if (this.applyForm.invalid || !this.selectedFile()) {
      alert('Please complete step 1 profile details.');
      return;
    }

    this.submitState.set('submitting');
    const { fullName, email } = this.applyForm.value;

    const answersList: CandidateAnswer[] = Object.entries(this.candidateAnswers()).map(
      ([question_id, selected_key]) => ({ question_id, selected_key })
    );

    this.apiService.applyToJob(
      this.jobId(),
      fullName!,
      email!,
      this.selectedFile()!,
      answersList
    ).subscribe({
      next: () => {
        setTimeout(() => this.submitState.set('success'), 1200);
      },
      error: (err) => {
        console.error('Application failed', err);
        this.submitState.set('error');
      }
    });
  }
}

