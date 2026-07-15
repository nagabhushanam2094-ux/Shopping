import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { ajax } from 'rxjs/ajax';
import { Observable } from 'rxjs';
import * as AuthActions from '../store/auth/auth.actions';
import { selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private store = inject(Store);
  private router = inject(Router);
  
  email = '';
  password = '';
  get isLoading$() {
    return this.store.select(selectAuthLoading);
  }
  get error$() {
    return this.store.select(selectAuthError);
  }
  private apiBaseUrl = '/api';

  onLogin() {
    if (!this.email.trim() || !this.password.trim()) {
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.store.dispatch(
        AuthActions.loginFailure({ error: 'Please enter a valid email address' })
      );
      return;
    }

    this.store.dispatch(AuthActions.login({ username: this.email }));

    // Call backend login endpoint
    ajax({
      url: `${this.apiBaseUrl}/login`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password
      })
    }).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response.response);
        this.store.dispatch(
          AuthActions.loginSuccess({ token: 'node-session-123' })
        );
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login error:', err);
        const errorMsg = err.response?.message || 'Invalid email or password';
        this.store.dispatch(
          AuthActions.loginFailure({ error: errorMsg })
        );
      },
    });
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  onSignup() {
    this.router.navigate(['/signup']);
  }
}
