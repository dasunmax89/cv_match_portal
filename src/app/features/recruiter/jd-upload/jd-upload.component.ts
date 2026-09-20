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
    title: ['']
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

  upload() {
    this.errorMessage.set(null);

    if (!this.selectedFile()) {
      this.errorMessage.set('Please select or drop a PDF file to analyze.');
      return;
    }

    const title = this.jdForm.value.title?.trim();

    this.isUploading.set(true);

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
    this.router.navigate(['/recruiter/jobs']);
  }

  viewJobCandidates() {
    const jobId = this.createdJob()?.id;
    if (jobId) {
      this.router.navigate(['/recruiter/jobs', jobId]);
    } else {
      this.router.navigate(['/recruiter/jobs']);
    }
  }

}
