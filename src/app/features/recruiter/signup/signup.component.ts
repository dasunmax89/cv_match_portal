import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

export type SignupTab = 'solo' | 'company';

@Component({
  selector: 'app-recruiter-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  activeTab: SignupTab = 'solo';

  // Solo Recruiter Form Fields
  soloFirstName = '';
  soloLastName = '';
  soloEmail = '';
  soloPhone = '';
  soloDesignation = '';
  soloPassword = '';
  soloConfirmPassword = '';
  agreeSoloTerms = false;

  // Company Form Fields
  companyName = '';
  companyWebsite = '';
  companyIndustry = '';
  companyTagline = '';
  companyEmail = '';
  companyPassword = '';
  companyConfirmPassword = '';
  agreeCompanyTerms = false;

  // Logo Upload State
  logoPreviewUrl: string | null = null;
  logoFileName: string | null = null;
  logoDimensions: string | null = null;
  logoUploadError: string | null = null;
  isDraggingLogo = false;

  // Global status & OTP step state
  errorMessage = '';
  isLoading = false;

  isOtpStep = false;
  otpEmail = '';
  otpCode = '';
  otpError = '';
  otpSuccessMsg = '';
  isVerifyingOtp = false;
  pendingUser: any = null;

  industries: string[] = [
    'Technology & Software',
    'Financial Services & Fintech',
    'Healthcare & BioTech',
    'E-Commerce & Retail',
    'Education & EdTech',
    'Manufacturing & Engineering',
    'Professional & Consulting Services',
    'Media & Entertainment',
    'Real Estate & Construction',
    'Energy & Utilities',
    'Other'
  ];

  setTab(tab: SignupTab) {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  // --- Logo File Upload Handling (300x300 Canvas Processing) ---
  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processLogoFile(input.files[0]);
    }
  }

  onLogoDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo = true;
  }

  onLogoDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo = false;
  }

  onLogoDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.processLogoFile(event.dataTransfer.files[0]);
    }
  }

  processLogoFile(file: File) {
    this.logoUploadError = null;
    if (!file.type.startsWith('image/')) {
      this.logoUploadError = 'Please upload a valid image file (PNG, JPG, WEBP, SVG).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.logoUploadError = 'Image file size should not exceed 5MB.';
      return;
    }

    this.logoFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const src = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 300, 300);

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
          this.logoPreviewUrl = canvas.toDataURL('image/png');
          this.logoDimensions = `${img.width}×${img.height} (Formatted to 300×300px)`;
        } else {
          this.logoPreviewUrl = src;
          this.logoDimensions = `${img.width}×${img.height} px`;
        }
      };

      img.onerror = () => {
        this.logoUploadError = 'Could not process logo image file.';
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.logoPreviewUrl = null;
    this.logoFileName = null;
    this.logoDimensions = null;
    this.logoUploadError = null;
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.activeTab === 'solo') {
      this.submitSoloRecruiter();
    } else {
      this.submitCompanyRecruiter();
    }
  }

  private submitSoloRecruiter() {
    if (!this.soloFirstName.trim() || !this.soloLastName.trim()) {
      this.errorMessage = 'Please provide both First Name and Last Name.';
      return;
    }

    if (!this.soloEmail.trim() || !this.soloEmail.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (!this.soloPhone.trim()) {
      this.errorMessage = 'Please enter your phone number.';
      return;
    }

    if (!this.soloPassword) {
      this.errorMessage = 'Please enter a password.';
      return;
    }

    if (this.soloPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.soloPassword !== this.soloConfirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.agreeSoloTerms) {
      this.errorMessage = 'You must agree to the additional terms and conditions.';
      return;
    }

    this.isLoading = true;
    const fullName = `${this.soloFirstName.trim()} ${this.soloLastName.trim()}`;
    const emailClean = this.soloEmail.trim();

    this.apiService.signupRecruiter({
      firstName: this.soloFirstName.trim(),
      lastName: this.soloLastName.trim(),
      email: emailClean,
      phone: this.soloPhone.trim(),
      password: this.soloPassword,
      designation: this.soloDesignation.trim() || 'Independent Recruiter'
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.pendingUser = {
          workEmail: emailClean,
          fullName: fullName,
          accountType: 'solo',
          token: res?.access_token
        };
        this.otpEmail = emailClean;
        this.isOtpStep = true;
        this.otpCode = res?.otp_code || ''; // Pre-fill debug OTP for convenience if returned
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Registration failed. Please check your information.';
      }
    });
  }

  private submitCompanyRecruiter() {
    if (!this.companyName.trim()) {
      this.errorMessage = 'Please enter your Company Name.';
      return;
    }

    if (!this.companyWebsite.trim()) {
      this.errorMessage = 'Please enter your Company Website.';
      return;
    }

    if (!this.companyIndustry) {
      this.errorMessage = 'Please select an Industry from the dropdown.';
      return;
    }

    if (!this.companyTagline.trim()) {
      this.errorMessage = 'Please enter a company Tagline.';
      return;
    }

    if (!this.companyEmail.trim() || !this.companyEmail.includes('@')) {
      this.errorMessage = 'Please enter a valid work email address.';
      return;
    }

    if (!this.companyPassword) {
      this.errorMessage = 'Please enter a password.';
      return;
    }

    if (this.companyPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.companyPassword !== this.companyConfirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.agreeCompanyTerms) {
      this.errorMessage = 'You must verify authorized representation and agree to the additional terms for Pages.';
      return;
    }

    this.isLoading = true;
    const emailClean = this.companyEmail.trim();

    this.apiService.signupCompany({
      companyName: this.companyName.trim(),
      website: this.companyWebsite.trim(),
      industry: this.companyIndustry,
      tagline: this.companyTagline.trim(),
      email: emailClean,
      password: this.companyPassword,
      logoData: this.logoPreviewUrl || null
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.pendingUser = {
          workEmail: emailClean,
          companyName: this.companyName.trim(),
          accountType: 'company',
          token: res?.access_token
        };
        this.otpEmail = emailClean;
        this.isOtpStep = true;
        this.otpCode = res?.otp_code || ''; // Pre-fill debug OTP for convenience if returned
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.message || 'Registration failed. Please check your information.';
      }
    });
  }

  // --- OTP Verification Logic ---
  onVerifyOtp() {
    this.otpError = '';
    this.otpSuccessMsg = '';

    if (!this.otpCode || !this.otpCode.trim()) {
      this.otpError = 'Please enter the verification OTP code.';
      return;
    }

    this.isVerifyingOtp = true;
    this.apiService.verifyOtp(this.otpEmail, this.otpCode.trim()).subscribe({
      next: (res) => {
        this.isVerifyingOtp = false;
        const userToLogin = res?.user || this.pendingUser || { workEmail: this.otpEmail };
        // Save accountType state explicitly
        userToLogin.accountType = this.pendingUser?.accountType || userToLogin.account_type || 'solo';
        this.authService.loginRecruiter(userToLogin);
        this.router.navigate(['/recruiter/onboarding']);
      },
      error: (err) => {
        this.isVerifyingOtp = false;
        this.otpError = err?.error?.detail || err?.message || 'Invalid or expired verification code. Please try again.';
      }
    });
  }

  onResendOtp() {
    this.otpError = '';
    this.otpSuccessMsg = '';
    this.apiService.resendOtp(this.otpEmail).subscribe({
      next: (res) => {
        this.otpSuccessMsg = `A new verification code has been sent to ${this.otpEmail}.`;
        if (res?.otp_code) {
          this.otpCode = res.otp_code;
        }
      },
      error: (err) => {
        this.otpError = err?.error?.detail || 'Failed to resend verification code.';
      }
    });
  }

  backToSignup() {
    this.isOtpStep = false;
    this.otpCode = '';
    this.otpError = '';
    this.otpSuccessMsg = '';
  }
}
