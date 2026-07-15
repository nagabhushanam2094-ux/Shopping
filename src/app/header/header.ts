import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectCartItemCount } from '../store/cart/cart.selectors';
import * as AuthActions from '../store/auth/auth.actions';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  cartItemCount$ = this.store.select(selectCartItemCount);

  logout() {
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/login']);
  }
}
