import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recruiter-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './recruiter-layout.component.html',
  styleUrl: './recruiter-layout.component.css',
})
export class RecruiterLayout {
  public authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isDropdownOpen = false;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  navigateTo(path: string) {
    this.closeDropdown();
    this.router.navigate([path]);
  }

  logout() {
    this.closeDropdown();
    this.authService.logoutRecruiter();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  get initials(): string {
    const user = this.authService.recruiterUser();
    if (!user) return 'RW';
    const name = user.companyName || user.company_name || user.fullName || user.full_name || user.workEmail || user.work_email || 'Recruiter';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
