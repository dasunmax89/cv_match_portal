import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './candidate-layout.component.html',
  styleUrl: './candidate-layout.component.css',
})
export class CandidateLayout {
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

  openSettings() {
    this.closeDropdown();
    this.router.navigate(['/candidate/profile'], { queryParams: { tab: 'preferences' } });
  }

  logout() {
    this.closeDropdown();
    this.authService.logoutCandidate();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  get initials(): string {
    const user = this.authService.candidateUser();
    if (!user) return 'CP';
    const first = user.firstName || user.first_name || (user.fullName ? user.fullName.split(' ')[0] : '');
    const last = user.lastName || user.last_name || (user.fullName && user.fullName.includes(' ') ? user.fullName.split(' ')[1] : '');
    const fChar = first ? first.charAt(0).toUpperCase() : 'C';
    const lChar = last ? last.charAt(0).toUpperCase() : 'P';
    return `${fChar}${lChar}`;
  }
}
