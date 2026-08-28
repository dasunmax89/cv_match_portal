import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ParsedCriteria, JobResponse } from '../../../core/models/candidate.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jd-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jd-upload.component.html'
})
export class JdUploadComponent {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isDragging = signal(false);
  isUploading = signal(false);
  createdJob = signal<JobResponse | null>(null);
  parsedCriteria = signal<ParsedCriteria | null>(null);
  selectedFile = signal<File | null>(null);
  errorMessage = signal<string | null>(null);

  jdForm = this.fb.group({
    title: ['', Validators.required]
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
    if (file.type !== 'application/pdf') {
      this.errorMessage.set('Please upload a valid PDF file.');
      return;
    }
    this.selectedFile.set(file);
  }

  upload() {
    this.errorMessage.set(null);
    if (this.jdForm.invalid || !this.selectedFile()) {
      this.errorMessage.set('Please provide a job title and select a PDF file.');
      return;
    }

    this.isUploading.set(true);
    const title = this.jdForm.value.title!;
    
    this.apiService.uploadJd(title, this.selectedFile()!).subscribe({
      next: (res) => {
        this.createdJob.set(res);
        this.parsedCriteria.set(res.criteria || (res as any));
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Upload failed', err);
        const detail = err?.error?.detail || err?.message || 'Failed to process Job Description with AI.';
        this.errorMessage.set(detail);
        this.isUploading.set(false);
      }
    });
  }

  publishJob() {
    const jobId = this.createdJob()?.id || Math.random().toString(36).substring(7);
    this.router.navigate(['/recruiter/jobs', jobId]);
  }
}
