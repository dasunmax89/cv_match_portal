import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-sjt-compose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sjt-compose.component.html'
})
export class SjtComposeComponent implements OnInit {
  @Input() jobId!: string;
  @Input() jobAssessment?: any;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  private apiService = inject(ApiService);

  requirements = signal<string>('');
  testCriteria = signal<string>('');
  
  isGenerating = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);

  // The editable questions object
  questions = signal<any[]>([]);

  ngOnInit() {
    if (this.jobAssessment && this.jobAssessment.questions) {
      this.questions.set(JSON.parse(JSON.stringify(this.jobAssessment.questions)));
    }
  }

  generateSjt() {
    this.error.set(null);
    this.isGenerating.set(true);
    
    this.apiService.generateCustomSjt(this.jobId, this.requirements(), this.testCriteria()).subscribe({
      next: (assessment) => {
        if (assessment && assessment.questions) {
          this.questions.set(assessment.questions);
        }
        this.isGenerating.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to generate SJT. Please try again.');
        this.isGenerating.set(false);
      }
    });
  }

  saveSjt() {
    this.error.set(null);
    this.isSaving.set(true);
    
    const assessmentPayload = this.jobAssessment ? { ...this.jobAssessment, questions: this.questions() } : {
      assessment_metadata: { framework: 'O*NET 28.0', primary_traits: [] },
      questions: this.questions()
    };

    this.apiService.updateJobSjt(this.jobId, assessmentPayload).subscribe({
      next: (updatedAssessment) => {
        this.saved.emit(updatedAssessment);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to save SJT. Please try again.');
        this.isSaving.set(false);
      }
    });
  }
}
