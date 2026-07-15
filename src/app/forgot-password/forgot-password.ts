import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ajax } from 'rxjs/ajax';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private router = inject(Router);

  email = '';
  phone = '';
  method: 'email' | 'sms' = 'email'; // Default to email
  isLoading = false;
  isSubmitted = false;
  successMessage = '';
  errorMessage = '';
  testMode = false;
  resetLink = '';
  private apiBaseUrl = '/api';

  onSubmit() {
    if (this.method === 'email') {
      this.submitEmail();
    } else {
      this.submitSms();
    }
  }

  submitEmail() {
    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // First, check if email is registered
    ajax({
      url: `${this.apiBaseUrl}/check-email`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: this.email })
    }).subscribe({
      next: (response: any) => {
        const isRegistered = response.response?.isRegistered;
        if (!isRegistered) {
          this.isLoading = false;
          this.errorMessage = 'Email not registered. Please sign up first.';
          console.log('Email not found, offer signup option');
          return;
        }
        // Email is registered, proceed with password reset
        this.sendPasswordResetEmail();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error checking email:', err);
        this.errorMessage = 'Failed to check email. Please try again.';
      }
    });
  }

  sendPasswordResetEmail() {
    // Call backend to send password reset email
    ajax({
      url: `${this.apiBaseUrl}/forgot-password`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: this.email,
        method: 'email',
        frontendUrl: window.location.origin
      })
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.testMode = response.response.testMode || false;
        this.resetLink = response.response.resetLink || '';
        this.successMessage = response.response.message || `Password reset link has been sent to ${this.email}`;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error sending reset email:', err);
        this.errorMessage = err.response?.message || 'Failed to send reset email. Please try again.';
      }
    });
  }

  submitSms() {
    if (!this.phone.trim()) {
      this.errorMessage = 'Please enter your phone number';
      return;
    }

    // Validate phone format (basic)
    const phoneRegex = /^[\d\-\+\s\(\)]+$/;
    if (!phoneRegex.test(this.phone)) {
      this.errorMessage = 'Please enter a valid phone number';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Call backend to send password reset via SMS
    ajax({
      url: `${this.apiBaseUrl}/forgot-password`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        phone: this.phone,
        email: this.phone, // Store phone as email identifier
        method: 'sms',
        frontendUrl: window.location.origin
      })
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.testMode = response.response.testMode || false;
        this.resetLink = response.response.resetLink || '';
        this.successMessage = response.response.message || `Password reset link has been sent to ${this.phone}`;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error sending SMS:', err);
        this.errorMessage = err.response?.message || 'Failed to send reset SMS. Please try again.';
      }
    });
  }

  copyResetLink() {
    if (this.resetLink) {
      navigator.clipboard.writeText(this.resetLink).then(() => {
        alert('Reset link copied to clipboard!');
      });
    }
  }

  goToResetLink() {
    if (this.resetLink) {
      window.location.href = this.resetLink;
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  resetForm() {
    this.email = '';
    this.phone = '';
    this.method = 'email';
    this.isSubmitted = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.testMode = false;
    this.resetLink = '';
  }
}
