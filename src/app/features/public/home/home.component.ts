import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private router = inject(Router);

  navigateToCandidateLogin() {
    this.router.navigate(['/candidate/login']);
  }

  navigateToRecruiterLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  navigateToManagementLogin() {
    this.router.navigate(['/management/login']);
  }

  navigateToCandidateOnboarding() {
    this.router.navigate(['/candidate/onboarding']);
  }

  navigateToCandidateJobs() {
    this.router.navigate(['/public/jobs']);
  }
}
