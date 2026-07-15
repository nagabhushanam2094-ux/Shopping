import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ajax } from 'rxjs/ajax';

interface DeliveryTimelineItem {
  status: string;
  completed: boolean;
  timestamp: string | null;
}

interface DeliveryTrackingResponse {
  orderId: string;
  partner: string;
  trackingId: string;
  trackingUrl: string;
  status: string;
  paymentMethod: string;
  updatedAt: string;
  timeline: DeliveryTimelineItem[];
}

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnDestroy {
  private readonly apiBaseUrl = '/api';
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  orderId = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  trackingData: DeliveryTrackingResponse | null = null;

  async trackOrder() {
    const id = String(this.orderId || '').trim();
    this.errorMessage = '';
    this.successMessage = '';

    if (!id) {
      this.trackingData = null;
      this.errorMessage = 'Please enter an order ID.';
      return;
    }

    this.loading = true;

    try {
      const tracking = await firstValueFrom(
        ajax.getJSON<DeliveryTrackingResponse>(`${this.apiBaseUrl}/delivery/track/${encodeURIComponent(id)}`)
      );

      this.trackingData = tracking;
      this.successMessage = `Current status: ${tracking.status}`;
      this.loading = false;
      this.startAutoRefresh();
    } catch (error: any) {
      this.trackingData = null;
      this.loading = false;
      const message = String(error?.response?.message || '').trim();
      this.errorMessage = message || 'Unable to fetch order tracking right now.';
      this.stopAutoRefresh();
    }
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  private startAutoRefresh() {
    this.stopAutoRefresh();

    this.pollTimer = setInterval(() => {
      if (!this.orderId.trim() || this.loading) {
        return;
      }

      void this.trackOrder();
    }, 30000);
  }

  private stopAutoRefresh() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
