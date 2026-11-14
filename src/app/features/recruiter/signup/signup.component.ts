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
  companyPhone = '';
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
    const firstNameClean = this.soloFirstName.trim();
    const lastNameClean = this.soloLastName.trim();
    const fullName = `${firstNameClean} ${lastNameClean}`;
    const emailClean = this.soloEmail.trim();
    const phoneClean = this.soloPhone.trim();
    const designationClean = this.soloDesignation.trim() || 'Independent Recruiter';

    this.apiService.signupRecruiter({
      firstName: firstNameClean,
      lastName: lastNameClean,
      email: emailClean,
      phone: phoneClean,
      password: this.soloPassword,
      designation: designationClean
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.pendingUser = {
          workEmail: emailClean,
          email: emailClean,
          fullName: fullName,
          full_name: fullName,
          firstName: firstNameClean,
          first_name: firstNameClean,
          lastName: lastNameClean,
          last_name: lastNameClean,
          phone: phoneClean,
          telephone: phoneClean,
          designation: designationClean,
          recruiterRole: designationClean,
          recruiter_role: designationClean,
          companyName: fullName || 'Independent Recruiter Workspace',
          company_name: fullName || 'Independent Recruiter Workspace',
          accountType: 'solo',
          account_type: 'solo',
          role: 'recruiter',
          token: res?.access_token,
          access_token: res?.access_token
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

    if (!this.companyPhone.trim()) {
      this.errorMessage = 'Please enter a telephone number.';
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
    const phoneClean = this.companyPhone.trim();
    const websiteClean = this.companyWebsite.trim();
    const industryClean = this.companyIndustry.trim();
    const taglineClean = this.companyTagline.trim();
    const companyNameClean = this.companyName.trim();
    const logoData = this.logoPreviewUrl || null;

    this.apiService.signupCompany({
      companyName: companyNameClean,
      website: websiteClean,
      industry: industryClean,
      tagline: taglineClean,
      email: emailClean,
      phone: phoneClean,
      telephone: phoneClean,
      password: this.companyPassword,
      logoData: logoData
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.pendingUser = {
          workEmail: emailClean,
          email: emailClean,
          companyName: companyNameClean,
          company_name: companyNameClean,
          companyWebsite: websiteClean,
          company_website: websiteClean,
          website: websiteClean,
          industry: industryClean,
          tagline: taglineClean,
          phone: phoneClean,
          telephone: phoneClean,
          companyLogo: logoData,
          company_logo: logoData,
          logo_data: logoData,
          logoData: logoData,
          profileImage: logoData,
          profile_image: logoData,
          accountType: 'company',
          account_type: 'company',
          role: 'company_admin',
          recruiterRole: 'Technical Recruiter',
          recruiter_role: 'Technical Recruiter',
          token: res?.access_token,
          access_token: res?.access_token
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
        const resUser = res?.user || {};
        const pending = this.pendingUser || {};
        const token = res?.access_token || pending.token || pending.access_token || this.authService.getToken();

        // 1. Resolve Logo / Company Profile Picture
        const resolvedLogo = pending.companyLogo || pending.logo_data || pending.logoData || 
          this.logoPreviewUrl || resUser.companyLogo || resUser.company_logo || resUser.logo_data || resUser.logoData || '';
        const resolvedProfileImage = pending.profileImage || pending.profile_image || 
          resUser.profileImage || resUser.profile_image || (pending.accountType === 'company' || this.activeTab === 'company' ? resolvedLogo : '') || '';

        // 2. Resolve Website
        const resolvedWebsite = pending.companyWebsite || pending.website || this.companyWebsite.trim() || 
          resUser.companyWebsite || resUser.company_website || resUser.website || '';

        // 3. Resolve Industry
        const resolvedIndustry = pending.industry || this.companyIndustry || resUser.industry || '';

        // 4. Resolve Company Name
        const resolvedCompanyName = pending.companyName || (this.activeTab === 'company' ? this.companyName.trim() : '') ||
          resUser.companyName || resUser.company_name || '';

        // 5. Resolve Names & Designation / Recruiter Role
        const resolvedFirstName = pending.firstName || this.soloFirstName.trim() || resUser.firstName || resUser.first_name || '';
        const resolvedLastName = pending.lastName || this.soloLastName.trim() || resUser.lastName || resUser.last_name || '';
        const resolvedFullName = pending.fullName || (resolvedFirstName ? `${resolvedFirstName} ${resolvedLastName}`.trim() : '') ||
          resUser.fullName || resUser.full_name || '';
        const resolvedDesignation = pending.designation || this.soloDesignation.trim() || resUser.designation || '';
        const resolvedRole = pending.recruiterRole || resolvedDesignation || resUser.recruiterRole || resUser.recruiter_role || 'Technical Recruiter';

        // 6. Resolve Contact Info & Account Type
        const resolvedPhone = pending.phone || pending.telephone || this.soloPhone.trim() || this.companyPhone.trim() ||
          resUser.phone || resUser.telephone || '';
        const resolvedAccountType = pending.accountType || this.activeTab || resUser.accountType || resUser.account_type || (resolvedCompanyName ? 'company' : 'solo');

        const userToLogin: any = {
          ...resUser,
          ...pending,
          token,
          access_token: token,
          workEmail: this.otpEmail || resUser.workEmail || resUser.email || pending.workEmail,
          email: this.otpEmail || resUser.email || resUser.workEmail || pending.workEmail,
          fullName: resolvedFullName,
          full_name: resolvedFullName,
          firstName: resolvedFirstName,
          first_name: resolvedFirstName,
          lastName: resolvedLastName,
          last_name: resolvedLastName,
          companyName: resolvedCompanyName || (resolvedAccountType === 'solo' ? resolvedFullName : 'Recruiter Workspace'),
          company_name: resolvedCompanyName || (resolvedAccountType === 'solo' ? resolvedFullName : 'Recruiter Workspace'),
          companyWebsite: resolvedWebsite,
          company_website: resolvedWebsite,
          website: resolvedWebsite,
          industry: resolvedIndustry,
          tagline: pending.tagline || this.companyTagline.trim() || resUser.tagline || '',
          phone: resolvedPhone,
          telephone: resolvedPhone,
          designation: resolvedDesignation,
          recruiterRole: resolvedRole,
          recruiter_role: resolvedRole,
          companyLogo: resolvedLogo,
          company_logo: resolvedLogo,
          logo_data: resolvedLogo,
          logoData: resolvedLogo,
          profileImage: resolvedProfileImage,
          profile_image: resolvedProfileImage,
          accountType: resolvedAccountType,
          account_type: resolvedAccountType,
          company_id: pending.company_id || resUser.company_id || resUser.companyId,
          companyId: pending.companyId || resUser.companyId || resUser.company_id
        };

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
