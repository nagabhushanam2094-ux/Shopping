import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  private apiUrl = '/api/products'; // Using your backend API

  constructor(private http: HttpClient) {}

  // Get all products from backend
  getProducts(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Get product by ID
  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  saveProductBarcode(id: number, barcode: string): Observable<any> {
    return this.http.post<any>('/api/products/barcode', { id, barcode });
  }

  getProductByBarcode(barcode: string): Observable<any> {
    return this.http.get<any>(`/api/products/barcode/${encodeURIComponent(barcode)}`);
  }

  // Example: Get public API data (JSONPlaceholder)
  getPosts(): Observable<any> {
    return this.http.get<any>('https://jsonplaceholder.typicode.com/posts?_limit=10');
  }

  // Example: Get users from public API
  getUsers(): Observable<any> {
    return this.http.get<any>('https://jsonplaceholder.typicode.com/users');
  }
}
