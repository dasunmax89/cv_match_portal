import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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
  }

  submitApplication() {
    if (this.applyForm.invalid || !this.selectedFile()) {
      alert('Please fill out all fields and attach your resume.');
      return;
    }

    this.submitState.set('submitting');
    const { fullName, email } = this.applyForm.value;

    this.apiService.applyToJob(this.jobId(), fullName!, email!, this.selectedFile()!).subscribe({
      next: () => {
        // Mock a slight delay for the AI analysis animation effect
        setTimeout(() => this.submitState.set('success'), 1500);
      },
      error: (err) => {
        console.error('Application failed', err);
        this.submitState.set('error');
      }
    });
  }
}
