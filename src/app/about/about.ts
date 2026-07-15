import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, map } from 'rxjs/operators';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface MeResponse {
  token: string;
}

interface MessageResponse {
  message: string;
}

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  private readonly cookieName = 'userPref';
  private readonly ngcatSessionName = 'ngcat-session';
  private readonly apiBaseUrl = '/api';

  users$: Observable<User[]> = ajax.getJSON<User[]>('https://jsonplaceholder.typicode.com/users');
  userProfile$: Observable<UserProfile | null> = of(null);
  cookieValue = '';
  ngcatSessionValue = '(not set)';
  serverCookieValue = '(not set)';
  serverStatus = '';

  constructor(private cookieService: CookieService) {
    this.readCookie();
    this.readNgcatSession();
    this.readServerCookie();
  }

  setCookie() {
    this.cookieService.set(this.cookieName, 'dark-mode', 7, '/');
    this.readCookie();
  }

  readCookie() {
    this.cookieValue = this.cookieService.get(this.cookieName) || '(not set)';
  }

  deleteCookie() {
    this.cookieService.delete(this.cookieName, '/');
    this.readCookie();
  }

  setNgcatSession() {
    this.cookieService.set(this.ngcatSessionName, 'please', 7, '/');
    this.readNgcatSession();
  }

  readNgcatSession() {
    this.ngcatSessionValue = this.cookieService.get(this.ngcatSessionName) || '(not set)';
  }

  deleteNgcatSession() {
    this.cookieService.delete(this.ngcatSessionName, '/');
    this.readNgcatSession();
  }

  setServerCookie() {
    ajax({
      url: `${this.apiBaseUrl}/login`,
      method: 'POST',
      withCredentials: true,
    }).subscribe({
      next: (response) => {
        const body = response.response as MessageResponse;
        this.serverStatus = body.message;
        this.readServerCookie();
        this.getUserProfile();
      },
      error: () => {
        this.serverStatus = 'Node API not reachable. Start backend with: npm run api';
      },
    });
  }

  readServerCookie() {
    ajax({
      url: `${this.apiBaseUrl}/me`,
      method: 'GET',
      withCredentials: true,
    }).subscribe({
      next: (response) => {
        const body = response.response as MeResponse;
        this.serverCookieValue = body.token || '(not set)';
        if (body.token) {
          this.getUserProfile();
        }
      },
      error: () => {
        this.serverCookieValue = '(Node API offline)';
        this.userProfile$ = of(null);
      },
    });
  }

  deleteServerCookie() {
    ajax({
      url: `${this.apiBaseUrl}/logout`,
      method: 'POST',
      withCredentials: true,
    }).subscribe({
      next: (response) => {
        const body = response.response as MessageResponse;
        this.serverStatus = body.message;
        this.readServerCookie();
        this.userProfile$ = of(null);
      },
      error: () => {
        this.serverStatus = 'Node API not reachable. Start backend with: npm run api';
      },
    });
  }

  getUserProfile() {
    this.userProfile$ = ajax({
      url: `${this.apiBaseUrl}/profile`,
      method: 'GET',
      withCredentials: true,
    }).pipe(
      map(response => response.response as UserProfile),
      catchError(() => {
        return of(null);
      })
    );
  }
}
