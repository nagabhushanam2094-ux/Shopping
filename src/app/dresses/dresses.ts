import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ajax } from 'rxjs/ajax';
import { addToCart, CartItem } from '../store/cart/cart.actions';

interface DressItem {
  id: number;
  name: string;
  type: 'Men' | 'Women';
  category: string;
  price: number;
  image: string;
  barcode: string;
}

@Component({
  selector: 'app-dresses',
  imports: [CommonModule],
  templateUrl: './dresses.html',
  styleUrl: './dresses.css',
})
export class Dresses implements OnInit {
  constructor(private readonly store: Store) {}
  private readonly apiBaseUrl = '/api';
  loadError = '';

  menDresses: DressItem[] = [
    {
      id: 101,
      name: 'Classic Blue Shirt',
      type: 'Men',
      category: 'Men Clothing',
      price: 34.99,
      image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      barcode: '8906140302201'
    },
    {
      id: 102,
      name: 'Slim Fit Blazer',
      type: 'Men',
      category: 'Men Clothing',
      price: 69.99,
      image: 'https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      barcode: '8906140302202'
    },
    {
      id: 103,
      name: 'Casual White Tee',
      type: 'Men',
      category: 'Men Clothing',
      price: 19.99,
      image: 'https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      barcode: '8906140302203'
    }
  ];

  womenDresses: DressItem[] = [
    {
      id: 201,
      name: 'Floral Summer Dress',
      type: 'Women',
      category: 'Women Clothing',
      price: 44.99,
      image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      barcode: '8906140302204'
    },
    {
      id: 202,
      name: 'Elegant Evening Gown',
      type: 'Women',
      category: 'Women Clothing',
      price: 89.99,
      image: 'https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      barcode: '8906140302205'
    },
    {
      id: 203,
      name: 'Casual Denim Look',
      type: 'Women',
      category: 'Women Clothing',
      price: 39.99,
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
      barcode: '8906140302206'
    }
  ];

  ngOnInit() {
    ajax.getJSON<DressItem[]>(`${this.apiBaseUrl}/dresses`).subscribe({
      next: (items) => {
        const list = Array.isArray(items) ? items : [];
        this.menDresses = list.filter((item) => item.type === 'Men');
        this.womenDresses = list.filter((item) => item.type === 'Women');
        this.loadError = '';
      },
      error: () => {
        this.loadError = 'Unable to load dresses from server. Showing saved list.';
      },
    });
  }

  addDressToCart(item: DressItem) {
    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      quantity: 1,
    };

    this.store.dispatch(addToCart({ item: cartItem }));
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://placehold.co/600x600/png?text=Dress+Image';
  }
}
