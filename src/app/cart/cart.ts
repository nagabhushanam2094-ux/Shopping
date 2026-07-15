import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { selectCartItems, selectCartTotal, selectCartItemCount } from '../store/cart/cart.selectors';
import { addToCart, removeFromCart, updateCartItemQuantity, clearCart } from '../store/cart/cart.actions';
import { RestService } from '../rest/rest.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements AfterViewInit, OnDestroy {
  @ViewChild('scanInput') private scanInputRef?: ElementRef<HTMLInputElement>;
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly restService = inject(RestService);
  private scanDebounceId: ReturnType<typeof setTimeout> | null = null;
  private audioContext: AudioContext | null = null;

  cartItems$ = this.store.select(selectCartItems);
  cartTotal$ = this.store.select(selectCartTotal);
  cartItemCount$ = this.store.select(selectCartItemCount);
  scannedBarcode = '';
  scanStatus = '';
  scanError = '';
  scanLoading = false;

  ngAfterViewInit() {
    this.focusScanInput();
  }

  ngOnDestroy() {
    if (this.scanDebounceId) {
      clearTimeout(this.scanDebounceId);
      this.scanDebounceId = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  removeItem(itemId: number) {
    this.store.dispatch(removeFromCart({ itemId }));
  }

  updateQuantity(itemId: number, quantity: number) {
    if (quantity > 0) {
      this.store.dispatch(updateCartItemQuantity({ itemId, quantity }));
    }
  }

  clearAllItems() {
    this.store.dispatch(clearCart());
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  onScanInputChange() {
    if (this.scanDebounceId) {
      clearTimeout(this.scanDebounceId);
      this.scanDebounceId = null;
    }

    // Many barcode scanners type quickly without requiring button click.
    this.scanDebounceId = setTimeout(() => {
      const barcode = String(this.scannedBarcode || '').trim();
      if (/^\d{8,14}$/.test(barcode) && !this.scanLoading) {
        this.addByBarcode();
      }
    }, 140);
  }

  addByBarcode() {
    if (this.scanLoading) {
      return;
    }

    this.scanStatus = '';
    this.scanError = '';
    const barcode = String(this.scannedBarcode || '').trim();

    if (!/^\d{8,14}$/.test(barcode)) {
      this.scanError = 'Enter a valid barcode (8 to 14 digits).';
      this.playErrorTone();
      return;
    }

    this.scanLoading = true;
    this.restService.getProductByBarcode(barcode).subscribe({
      next: (product) => {
        this.store.dispatch(addToCart({
          item: {
            id: Number(product.id),
            name: String(product.name || ''),
            category: String(product.category || ''),
            price: Number(product.price || 0),
            image: String(product.image || ''),
            quantity: 1,
          }
        }));
        this.scanStatus = `${product.name} added to cart.`;
        this.scannedBarcode = '';
        this.scanLoading = false;
        this.playSuccessBeep();
        this.focusScanInput();
      },
      error: (err) => {
        this.scanError = err?.error?.message || 'Product not found for this barcode.';
        this.scanLoading = false;
        this.playErrorTone();
        this.focusScanInput();
      }
    });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContextClass();
    }

    return this.audioContext;
  }

  private playTone(frequency: number, durationMs: number, type: OscillatorType = 'sine') {
    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec);
  }

  private playSuccessBeep() {
    this.playTone(1080, 90, 'triangle');
    setTimeout(() => this.playTone(1320, 70, 'triangle'), 95);
  }

  private playErrorTone() {
    this.playTone(260, 160, 'sawtooth');
  }

  private focusScanInput() {
    setTimeout(() => {
      this.scanInputRef?.nativeElement?.focus();
      this.scanInputRef?.nativeElement?.select();
    }, 0);
  }
}
