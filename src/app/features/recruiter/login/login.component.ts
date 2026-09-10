import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-recruiter-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {
  isSignUp = false;
  workEmail = '';
  password = '';
  companyName = '';

  constructor(private router: Router) {}

  toggleMode() {
    this.isSignUp = !this.isSignUp;
  }

  onSubmit() {
    if (this.isSignUp) {
      this.router.navigate(['/recruiter/onboarding']);
    } else {
      this.router.navigate(['/recruiter/jobs']);
    }
  }
}
