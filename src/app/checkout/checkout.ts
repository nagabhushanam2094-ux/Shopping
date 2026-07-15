import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { selectCartItems, selectCartTotal, selectCartItemCount } from '../store/cart/cart.selectors';

interface CheckoutItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
}

interface PhonePeInitiateResponse {
  message: string;
  emailMessage?: string;
  email?: string;
  upiId?: string;
  upiIntentUrl?: string;
  qrCodeUrl?: string;
  testMode?: boolean;
  paymentUrl?: string;
  merchantTransactionId?: string;
  payload?: string;
  checksum?: string;
}

interface CardPaymentResponse {
  message: string;
  emailMessage?: string;
  email?: string;
  transactionId?: string;
  paymentMethod?: string;
  shipment?: DeliveryShipmentSummary | null;
  shipmentError?: string;
}

interface DeliveryShipmentSummary {
  orderId?: string;
  partner?: string;
  trackingId?: string;
  trackingUrl?: string;
  status?: string;
}

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

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface ChatAssistantResponse {
  reply: string;
}

interface NominatimSearchResult {
  address?: {
    postcode?: string;
  };
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly apiBaseUrl = '/api';
  private mapLookupTimer: ReturnType<typeof setTimeout> | null = null;
  private deliveryPollTimer: ReturnType<typeof setInterval> | null = null;
  private postalLookupRequestId = 0;

  cartItems$ = this.store.select(selectCartItems);
  cartTotal$ = this.store.select(selectCartTotal);
  cartItemCount$ = this.store.select(selectCartItemCount);

  fullName = '';
  email = '';
  phone = '';
  upiId = '';
  paymentMethod: 'upi' | 'card' = 'upi';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';
  address = '';
  city = '';
  state = '';
  postalCode = '';
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  paymentUrl = '';
  deliveryOrderId = '';
  deliveryTrackingLoading = false;
  deliveryTrackingError = '';
  deliveryTrackingSuccess = '';
  deliveryTrackingData: DeliveryTrackingResponse | null = null;
  upiIdUsed = '';
  upiIntentUrl = '';
  qrCodeUrl = '';
  testMode = false;
  testModeMessage = 'PhonePe test mode enabled.';
  chatInput = '';
  isChatLoading = false;
  mapError = '';
  mapEmbedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.buildSearchEmbedUrl('Bengaluru, Karnataka'));
  chatMessages: ChatMessage[] = [
    {
      sender: 'bot',
      text: 'Hi! I can help with checkout, UPI, and order confirmation email. Ask anything.',
      timestamp: new Date(),
    }
  ];
  quickPrompts = [
    'How do I pay with UPI?',
    'Will I get confirmation email?',
    'What if payment fails?',
    'Can I checkout without UPI?'
  ];
  cityOptions = [
    'Bengaluru',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Lucknow'
  ];
  stateOptions = [
    'Karnataka',
    'Maharashtra',
    'Delhi',
    'Telangana',
    'Tamil Nadu',
    'West Bengal',
    'Gujarat',
    'Rajasthan',
    'Uttar Pradesh',
    'Kerala'
  ];
  chatOpen = false;

  ngOnInit() {
    this.cartItems$.subscribe((items) => {
      if (!items || !items.length) {
        this.errorMessage = 'Your cart is empty. Add products before checkout.';
      }
    });
  }

  ngOnDestroy() {
    if (this.mapLookupTimer) {
      clearTimeout(this.mapLookupTimer);
      this.mapLookupTimer = null;
    }

    this.stopDeliveryAutoRefresh();
  }

  scheduleMapUpdate() {
    if (this.mapLookupTimer) {
      clearTimeout(this.mapLookupTimer);
    }

    this.mapLookupTimer = setTimeout(() => {
      void this.updateMapLocation();
    }, 500);
  }

  private buildSearchEmbedUrl(query: string) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  private async lookupPostalCode(query: string): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        return '';
      }

      const results = await response.json() as NominatimSearchResult[];
      const rawPostal = String(results?.[0]?.address?.postcode || '');
      const digitsOnly = rawPostal.replace(/\D/g, '').slice(0, 6);
      return digitsOnly.length === 6 ? digitsOnly : '';
    } catch {
      return '';
    }
  }

  async updateMapLocation() {
    const queryParts = [this.address, this.city, this.state, this.postalCode]
      .map((part) => String(part || '').trim())
      .filter(Boolean);

    if (!queryParts.length) {
      this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.buildSearchEmbedUrl('Bengaluru, Karnataka'));
      this.mapError = '';
      return;
    }

    const fullAddress = queryParts.join(', ');
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.buildSearchEmbedUrl(fullAddress));
    this.mapError = '';

    const addressQuery = [this.address, this.city, this.state]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(', ');

    const shouldAutoFillPostal = this.postalCode.trim().length < 6 && Boolean(addressQuery);
    if (!shouldAutoFillPostal) {
      return;
    }

    const requestId = ++this.postalLookupRequestId;
    const detectedPostalCode = await this.lookupPostalCode(addressQuery);
    if (requestId !== this.postalLookupRequestId || !detectedPostalCode) {
      return;
    }

    this.postalCode = detectedPostalCode;
    const refreshedAddress = [this.address, this.city, this.state, this.postalCode]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(', ');
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.buildSearchEmbedUrl(refreshedAddress));
  }

  goBackToCart() {
    this.router.navigate(['/cart']);
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  payWithPhonePe() {
    if (!this.fullName.trim() || !this.email.trim() || !this.phone.trim() || !this.address.trim() || !this.postalCode.trim()) {
      this.errorMessage = 'Please fill in the delivery details before paying.';
      return;
    }

    if (!/^\d{6}$/.test(this.postalCode)) {
      this.errorMessage = 'Please enter a valid 6-digit postal code.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.qrCodeUrl = '';
    this.upiIntentUrl = '';
    this.upiIdUsed = '';
    this.testModeMessage = 'PhonePe test mode enabled.';

    if (this.paymentMethod === 'card') {
      const sanitizedCardNumber = this.cardNumber.replace(/\s+/g, '');
      if (!/^\d{13,19}$/.test(sanitizedCardNumber)) {
        this.isProcessing = false;
        this.errorMessage = 'Please enter a valid card number.';
        return;
      }

      if (!String(this.cardName || '').trim()) {
        this.isProcessing = false;
        this.errorMessage = 'Please enter the name on card.';
        return;
      }

      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(this.cardExpiry)) {
        this.isProcessing = false;
        this.errorMessage = 'Enter card expiry as MM/YY.';
        return;
      }

      if (!/^\d{3,4}$/.test(this.cardCvv)) {
        this.isProcessing = false;
        this.errorMessage = 'Please enter a valid CVV.';
        return;
      }

      void this.submitCardPayment();
      return;
    }

    void this.submitPhonePePayment();
  }

  private async submitPhonePePayment() {
    const cartItems = await firstValueFrom(this.cartItems$);
    const items = (cartItems || []) as CheckoutItem[];
    const contactUpiId = this.upiId.trim();
    if (!items.length) {
      this.isProcessing = false;
      this.errorMessage = 'Your cart is empty. Add products before checkout.';
      return;
    }

    const amount = this.roundAmount(items.reduce((total, item) => total + item.price * item.quantity, 0));

    ajax({
      url: `${this.apiBaseUrl}/phonepe/initiate`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          name: this.fullName,
          email: this.email,
          phone: this.phone,
          upiId: contactUpiId,
          address: this.address,
          city: this.city,
          state: this.state,
          postalCode: this.postalCode
        },
        items,
        amount,
        frontendUrl: window.location.origin
      })
    }).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        const payload = response.response as PhonePeInitiateResponse;
        this.testMode = Boolean(payload.testMode);
        this.paymentUrl = payload.paymentUrl || '';
        this.upiIdUsed = payload.upiId || '';
        this.upiIntentUrl = payload.upiIntentUrl || '';
        this.qrCodeUrl = payload.qrCodeUrl || '';
        this.testModeMessage = this.testMode
          ? (this.qrCodeUrl
              ? `PhonePe test mode enabled. Scan QR to pay ${this.upiIdUsed || 'using UPI'}.`
              : 'PhonePe test mode enabled. Merchant credentials are not configured.')
          : '';

        if (!this.testMode && this.paymentUrl) {
          window.location.href = this.paymentUrl;
          return;
        }

        const baseMessage = payload.message || 'PhonePe payment request created.';
        const emailMessage = payload.emailMessage || '';
        this.successMessage = [baseMessage, emailMessage].filter(Boolean).join(' ');
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('PhonePe checkout error:', error);
        if (error.status === 0) {
          this.errorMessage = 'Unable to reach the payment backend. Start it with npm run api.';
          return;
        }

        this.errorMessage = error.response?.message || 'Unable to start PhonePe payment. Please try again.';
      }
    });
  }

  private async submitCardPayment() {
    const cartItems = await firstValueFrom(this.cartItems$);
    const items = (cartItems || []) as CheckoutItem[];

    if (!items.length) {
      this.isProcessing = false;
      this.errorMessage = 'Your cart is empty. Add products before checkout.';
      return;
    }

    const amount = this.roundAmount(items.reduce((total, item) => total + item.price * item.quantity, 0));
    const maskedCard = this.cardNumber.replace(/\D/g, '').slice(-4).padStart(4, '*');

    ajax({
      url: `${this.apiBaseUrl}/payment/card`,
      method: 'POST',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          name: this.fullName,
          email: this.email,
          phone: this.phone,
          address: this.address,
          city: this.city,
          state: this.state,
          postalCode: this.postalCode
        },
        card: {
          last4: maskedCard,
          holderName: this.cardName,
          expiry: this.cardExpiry,
        },
        items,
        amount,
      })
    }).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        const payload = response.response as CardPaymentResponse;
        const baseMessage = payload.message || 'Card payment completed successfully.';
        const emailMessage = payload.emailMessage || '';
        const shipmentMessage = payload.shipmentError ? `Delivery booking pending: ${payload.shipmentError}` : '';
        this.successMessage = [baseMessage, emailMessage, shipmentMessage].filter(Boolean).join(' ');

        if (payload.transactionId) {
          this.deliveryOrderId = payload.transactionId;
          void this.fetchDeliveryTracking();
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Card checkout error:', error);
        if (error.status === 0) {
          this.errorMessage = 'Unable to reach the payment backend. Start it with npm run api.';
          return;
        }

        this.errorMessage = error.response?.message || 'Unable to complete card payment. Please try again.';
      }
    });
  }

  private roundAmount(amount: number) {
    return Math.max(1, Math.round(amount * 100) / 100);
  }

  onPostalCodeChange(value: string) {
    this.postalCode = String(value || '').replace(/\D/g, '').slice(0, 6);
    this.scheduleMapUpdate();
  }

  async fetchDeliveryTracking() {
    const orderId = String(this.deliveryOrderId || '').trim();
    this.deliveryTrackingError = '';
    this.deliveryTrackingSuccess = '';

    if (!orderId) {
      this.deliveryTrackingData = null;
      this.deliveryTrackingError = 'Enter order ID to track shipment.';
      return;
    }

    this.deliveryTrackingLoading = true;

    try {
      const tracking = await firstValueFrom(
        ajax.getJSON<DeliveryTrackingResponse>(`${this.apiBaseUrl}/delivery/track/${encodeURIComponent(orderId)}`)
      );

      this.deliveryTrackingData = tracking;
      this.deliveryTrackingSuccess = `Live status: ${tracking.status}`;
      this.deliveryTrackingLoading = false;
      this.startDeliveryAutoRefresh();
    } catch (error: any) {
      this.deliveryTrackingData = null;
      this.deliveryTrackingLoading = false;
      const message = String(error?.response?.message || '').trim();
      this.deliveryTrackingError = message || 'Unable to fetch delivery status right now.';
      this.stopDeliveryAutoRefresh();
    }
  }

  private startDeliveryAutoRefresh() {
    this.stopDeliveryAutoRefresh();

    this.deliveryPollTimer = setInterval(() => {
      const hasOrderId = Boolean(String(this.deliveryOrderId || '').trim());
      if (!hasOrderId || this.deliveryTrackingLoading) {
        return;
      }

      void this.fetchDeliveryTracking();
    }, 30000);
  }

  private stopDeliveryAutoRefresh() {
    if (this.deliveryPollTimer) {
      clearInterval(this.deliveryPollTimer);
      this.deliveryPollTimer = null;
    }
  }

  sendChatMessage() {
    const message = this.chatInput.trim();
    if (!message) {
      return;
    }

    this.appendUserChat(message);
    this.chatInput = '';
    void this.respondToChat(message);
  }

  useQuickPrompt(prompt: string) {
    this.appendUserChat(prompt);
    void this.respondToChat(prompt);
  }

  private appendUserChat(text: string) {
    this.chatMessages.push({
      sender: 'user',
      text,
      timestamp: new Date(),
    });
  }

  private appendBotChat(text: string) {
    this.chatMessages.push({
      sender: 'bot',
      text,
      timestamp: new Date(),
    });
  }

  private async respondToChat(rawText: string) {
    this.isChatLoading = true;

    try {
      const response = await firstValueFrom(ajax({
        url: `${this.apiBaseUrl}/chat-assistant`,
        method: 'POST',
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: rawText,
          context: {
            name: this.fullName,
            email: this.email,
            phone: this.phone,
            upiId: this.upiId,
            address: this.address,
            city: this.city,
            state: this.state,
            postalCode: this.postalCode,
            testMode: this.testMode
          }
        })
      }));

      const payload = response.response as ChatAssistantResponse;
      this.appendBotChat(payload.reply || 'I am here to help with checkout and payment.');
      this.isChatLoading = false;
      return;
    } catch (error) {
      console.warn('Chat assistant API unavailable, using local fallback.', error);
      this.isChatLoading = false;
    }

    this.respondToChatFallback(rawText);
  }

  private respondToChatFallback(rawText: string) {
    const text = rawText.toLowerCase();

    if (text.includes('upi')) {
      this.appendBotChat('Enter your UPI ID in the UPI field (example: name@bank). It is optional, and you can still submit with email confirmation.');
      return;
    }

    if (text.includes('email') || text.includes('confirmation') || text.includes('receipt')) {
      this.appendBotChat('Yes. After submit, we return an email confirmation response. If email service is unavailable, test-mode confirmation is shown.');
      return;
    }

    if (text.includes('fail') || text.includes('error') || text.includes('unable')) {
      this.appendBotChat('If payment fails, check backend status (npm run api), verify details, and try submit again. Your delivery details stay on this page.');
      return;
    }

    if (text.includes('without upi') || text.includes('no upi') || text.includes('optional')) {
      this.appendBotChat('Yes, checkout works without UPI. Leave UPI blank and submit. Email is used for order confirmation.');
      return;
    }

    if (text.includes('status') || text.includes('order')) {
      this.appendBotChat('Order status appears after submit in the success panel. In test mode, you will also see PhonePe test-mode notice.');
      return;
    }

    this.appendBotChat('I can help with UPI setup, email confirmation, payment issues, and checkout steps. Try one of the quick prompts below.');
  }
}