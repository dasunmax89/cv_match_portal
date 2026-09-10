import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-candidate-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {
  isSignUp = false;
  email = '';
  password = '';
  fullName = '';

  constructor(private router: Router) {}

  toggleMode() {
    this.isSignUp = !this.isSignUp;
  }

  onSubmit() {
    // Navigate to candidate onboarding or job board
    if (this.isSignUp) {
      this.router.navigate(['/candidate/onboarding']);
    } else {
      this.router.navigate(['/candidate/dashboard']);
    }
  }
}
