import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-management-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {
  adminId = '';
  password = '';
  mfaCode = '';

  constructor(private router: Router) {}

  onSubmit() {
    this.router.navigate(['/management/dashboard']);
  }
}
