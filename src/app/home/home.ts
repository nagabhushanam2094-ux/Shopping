import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ajax } from 'rxjs/ajax';
import { addToCart, CartItem } from '../store/cart/cart.actions';

interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  barcode?: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly store = inject(Store);
  private readonly apiBaseUrl = '/api';

  items: Item[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    ajax.getJSON<Item[]>(`${this.apiBaseUrl}/products`).subscribe({
      next: (products) => {
        this.items = products ?? [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Products load error:', error);
        this.errorMessage = 'Unable to load products right now. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://placehold.co/600x600/png?text=No+Image';
  }

  addToCart(item: Item) {
    const cartItem: CartItem = { ...item, quantity: 1 };
    this.store.dispatch(addToCart({ item: cartItem }));
  }
}
