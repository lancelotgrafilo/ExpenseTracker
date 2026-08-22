export interface Expense {
  id: string;
  amount: number;
  category: string; // free-text, user types this in
  date: string; // ISO 8601 format, e.g. "2026-08-22"
  note?: string;
}
