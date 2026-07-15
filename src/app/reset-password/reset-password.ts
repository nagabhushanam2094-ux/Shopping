import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ajax } from 'rxjs/ajax';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  email = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  isSubmitted = false;
  successMessage = '';
  errorMessage = '';
  passwordStrength = '';
  private apiBaseUrl = '/api';

  ngOnInit() {
    // Get token and email from URL query parameters
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token || !this.email) {
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkPasswordStrength() {
    const pwd = this.newPassword;
    
    if (pwd.length === 0) {
      this.passwordStrength = '';
      return;
    }

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength < 2) this.passwordStrength = 'weak';
    else if (strength < 4) this.passwordStrength = 'medium';
    else this.passwordStrength = 'strong';
  }

  onSubmit() {
    // Validation
    if (!this.newPassword.trim()) {
      this.errorMessage = 'Please enter a new password';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.token || !this.email) {
      this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Call backend to reset password
    ajax({
      url: `${this.apiBaseUrl}/reset-password`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: this.token,
        email: this.email,
        newPassword: this.newPassword
      })
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error resetting password:', err);
        this.errorMessage = err.response?.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  requestNewReset() {
    this.router.navigate(['/forgot-password']);
  }
}
