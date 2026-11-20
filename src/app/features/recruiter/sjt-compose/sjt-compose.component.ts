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
  @Input() startWithNewQuestion: boolean = false;
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
      const cloned = JSON.parse(JSON.stringify(this.jobAssessment.questions));
      this.questions.set(cloned.map((q: any) => this.ensureQuestionStructure(q)));
    }
    if (this.startWithNewQuestion || this.questions().length === 0) {
      this.addCustomQuestion();
    }
  }

  ensureQuestionStructure(q: any): any {
    if (!q) return q;
    if (!q.id) {
      q.id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
      q.options = [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ];
    }
    if (!q.rubric || typeof q.rubric !== 'object') {
      q.rubric = {};
    }
    const defaultScores: Record<string, number> = { A: 4, B: 2, C: 1, D: 0 };
    for (const opt of q.options) {
      if (!q.rubric[opt.key]) {
        q.rubric[opt.key] = {
          score: defaultScores[opt.key] ?? 2,
          rationale: ''
        };
      } else if (typeof q.rubric[opt.key].score !== 'number') {
        q.rubric[opt.key].score = Number(q.rubric[opt.key].score) || 0;
      }
    }
    return q;
  }

  addCustomQuestion() {
    const current = [...this.questions()];
    const newIndex = current.length + 1;
    const newQuestion = this.ensureQuestionStructure({
      id: `q_${Date.now()}_${newIndex}`,
      scenario: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      rubric: {
        A: { score: 4, rationale: 'Optimal response demonstrating proactive problem-solving.' },
        B: { score: 2, rationale: 'Standard / acceptable operational response.' },
        C: { score: 1, rationale: 'Sub-optimal response with delayed action.' },
        D: { score: 0, rationale: 'Ineffective or counterproductive response.' }
      }
    });
    current.push(newQuestion);
    this.questions.set(current);
  }

  removeQuestion(index: number) {
    const current = [...this.questions()];
    current.splice(index, 1);
    this.questions.set(current);
  }

  generateSjt() {
    this.error.set(null);
    this.isGenerating.set(true);
    
    this.apiService.generateCustomSjt(this.jobId, this.requirements(), this.testCriteria()).subscribe({
      next: (assessment) => {
        if (assessment && assessment.questions) {
          this.questions.set(assessment.questions.map((q: any) => this.ensureQuestionStructure(q)));
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
    const qs = this.questions();
    if (qs.length === 0) {
      this.error.set('Please add at least one question to the questionnaire before saving.');
      return;
    }

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      if (!q.scenario || !q.scenario.trim()) {
        this.error.set(`Question Q${i + 1} has an empty scenario. Please fill in the scenario description.`);
        return;
      }
      for (const opt of q.options || []) {
        if (!opt.text || !opt.text.trim()) {
          this.error.set(`Question Q${i + 1}, Option ${opt.key} is empty. Please enter the option answer text.`);
          return;
        }
      }
    }

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
