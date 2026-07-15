import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ajax } from 'rxjs/ajax';

interface DbSummaryItem {
  table: string;
  count: number;
}

interface DbSummaryResponse {
  database: string;
  summary: DbSummaryItem[];
  serverTime: string;
}

interface DbTableResponse {
  table: string;
  limit: number;
  count: number;
  rows: Record<string, any>[];
}

@Component({
  selector: 'app-database',
  imports: [CommonModule, FormsModule],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit {
  private readonly apiBaseUrl = '/api';

  summary: DbSummaryItem[] = [];
  summaryLoading = false;
  summaryError = '';

  selectedTable = 'products';
  tableLimit = 25;
  rows: Record<string, any>[] = [];
  columns: string[] = [];
  rowsLoading = false;
  rowsError = '';

  readonly tableOptions = ['users', 'products', 'dresses', 'delivery_shipments'];

  ngOnInit() {
    void this.loadSummary();
    void this.loadTableData();
  }

  async loadSummary() {
    this.summaryLoading = true;
    this.summaryError = '';

    try {
      const response = await firstValueFrom(
        ajax.getJSON<DbSummaryResponse>(`${this.apiBaseUrl}/admin/db/summary`)
      );
      this.summary = response.summary || [];
      this.summaryLoading = false;
    } catch (error: any) {
      this.summaryLoading = false;
      this.summaryError = String(error?.response?.message || 'Unable to load DB summary');
    }
  }

  async loadTableData() {
    this.rowsLoading = true;
    this.rowsError = '';

    const limit = Math.max(1, Math.min(200, Number(this.tableLimit) || 25));

    try {
      const response = await firstValueFrom(
        ajax.getJSON<DbTableResponse>(
          `${this.apiBaseUrl}/admin/db/table/${encodeURIComponent(this.selectedTable)}?limit=${limit}`
        )
      );

      this.rows = response.rows || [];
      this.columns = this.rows.length ? Object.keys(this.rows[0]) : [];
      this.rowsLoading = false;
    } catch (error: any) {
      this.rowsLoading = false;
      this.rows = [];
      this.columns = [];
      this.rowsError = String(error?.response?.message || 'Unable to load table data');
    }
  }
}
