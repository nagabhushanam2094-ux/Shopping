import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService } from './rest.service';

@Component({
  selector: 'app-rest',
  imports: [CommonModule, FormsModule],
  templateUrl: './rest.html',
  styleUrl: './rest.css',
})
export class Rest implements OnInit, OnDestroy {
  private restService = inject(RestService);
  private timerIntervalId: ReturnType<typeof setInterval> | null = null;

  posts: any[] = [];
  loading = false;
  error = '';
  sourceType: 'posts' | 'products' = 'posts';
  barcodeProductId: number | null = null;
  barcodeValue = '';
  barcodeSaving = false;
  barcodeSuccess = '';
  barcodeError = '';
  timerMinutes = 0;
  timerSeconds = 30;
  remainingSeconds = 30;
  timerRunning = false;

  ngOnInit() {
    this.fetchPosts();
  }

  ngOnDestroy() {
    this.clearTimerInterval();
  }

  get formattedTimer(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  startTimer() {
    const configuredSeconds = this.clampSeconds((this.timerMinutes * 60) + this.timerSeconds);

    if (!this.timerRunning) {
      if (this.remainingSeconds <= 0 || this.remainingSeconds !== configuredSeconds) {
        this.remainingSeconds = configuredSeconds;
      }

      if (this.remainingSeconds <= 0) {
        return;
      }

      this.timerRunning = true;
      this.timerIntervalId = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds -= 1;
          return;
        }

        this.clearTimerInterval();
        this.timerRunning = false;
        this.triggerAlarm();
      }, 1000);
    }
  }

  pauseTimer() {
    this.clearTimerInterval();
    this.timerRunning = false;
  }

  resetTimer() {
    this.pauseTimer();
    this.remainingSeconds = this.clampSeconds((this.timerMinutes * 60) + this.timerSeconds);
  }

  onTimerInputChange() {
    if (this.timerRunning) {
      return;
    }

    this.timerMinutes = Math.max(0, Math.floor(this.timerMinutes || 0));
    this.timerSeconds = Math.min(59, Math.max(0, Math.floor(this.timerSeconds || 0)));
    this.remainingSeconds = this.clampSeconds((this.timerMinutes * 60) + this.timerSeconds);
  }

  private clampSeconds(value: number): number {
    return Math.min(359999, Math.max(0, Math.floor(value || 0)));
  }

  private clearTimerInterval() {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private triggerAlarm() {
    // Keep alarm simple and browser-safe.
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 150, 200, 150, 300]);
    }

    window.alert('Timer finished. Alarm!');
  }

  fetchPosts() {
    this.loading = true;
    this.error = '';
    this.sourceType = 'posts';
    this.restService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load posts';
        console.error('Error fetching posts:', err);
        this.loading = false;
      }
    });
  }

  // Alternative: To fetch from your backend API instead
  fetchProducts() {
    this.loading = true;
    this.error = '';
    this.sourceType = 'products';
    this.restService.getProducts().subscribe({
      next: (data) => {
        this.posts = data; // Reusing posts variable to display products
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products';
        console.error('Error fetching products:', err);
        this.loading = false;
      }
    });
  }

  saveBarcode() {
    this.barcodeSuccess = '';
    this.barcodeError = '';

    const productId = Number(this.barcodeProductId);
    const barcode = String(this.barcodeValue || '').trim();

    if (!Number.isInteger(productId) || productId <= 0) {
      this.barcodeError = 'Enter a valid product ID.';
      return;
    }

    if (!/^\d{8,14}$/.test(barcode)) {
      this.barcodeError = 'Barcode must be 8 to 14 digits.';
      return;
    }

    this.barcodeSaving = true;
    this.restService.saveProductBarcode(productId, barcode).subscribe({
      next: () => {
        this.barcodeSuccess = 'Barcode saved successfully.';
        this.barcodeSaving = false;
        if (this.sourceType === 'products') {
          this.fetchProducts();
        }
      },
      error: (err) => {
        this.barcodeError = err?.error?.message || 'Failed to save barcode.';
        this.barcodeSaving = false;
      }
    });
  }
}
