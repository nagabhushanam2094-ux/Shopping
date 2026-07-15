import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ajax } from 'rxjs/ajax';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  name = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  private apiBaseUrl = '/api';

  private extractErrorMessage(err: any): string {
    const response = err?.response;

    if (response && typeof response === 'object' && typeof response.message === 'string') {
      return response.message;
    }

    if (typeof response === 'string' && response.trim()) {
      try {
        const parsed = JSON.parse(response);
        if (parsed && typeof parsed.message === 'string') {
          return parsed.message;
        }
      } catch {
        return response;
      }
    }

    return '';
  }

  onSubmit() {
    // Validate fields
    if (!this.email.trim() || !this.password.trim() || !this.confirmPassword.trim() || !this.name.trim()) {
      this.errorMessage = 'All fields are required';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    // Validate password length
    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    // Check passwords match
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Call backend signup endpoint
    ajax({
      url: `${this.apiBaseUrl}/signup`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
        name: this.name
      })
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = response.response.message || 'Signup successful!';
        console.log('Signup successful:', response.response);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Signup error:', err);
        const backendMessage = this.extractErrorMessage(err);

        if (err.status === 409) {
          this.errorMessage = backendMessage || 'Email already registered. Please log in or use a different email.';
        } else if (err.status === 400) {
          this.errorMessage = backendMessage || 'Please check your signup details and try again.';
        } else if (err.status === 0) {
          this.errorMessage = 'Unable to reach the backend server. Start it with npm run api.';
        } else {
          this.errorMessage = backendMessage || 'Signup failed. Please try again.';
        }
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
