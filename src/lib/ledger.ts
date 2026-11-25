import type { Direction, EntryType, Page } from "@/lib/api/types";

/** The four labels the customer ledger shows for an entry type. */
export type LedgerKind = "creditSale" | "payment" | "adjustment" | "reversal";

const CREDIT_SALE = new Set<EntryType>(["CreditSale", "OpeningBalance", "CreditPurchase"]);
const PAYMENT = new Set<EntryType>(["PaymentReceived", "PaymentMade"]);

export function ledgerKind(entryType: EntryType): LedgerKind {
  if (entryType === "Reversal") return "reversal";
  if (CREDIT_SALE.has(entryType)) return "creditSale";
  if (PAYMENT.has(entryType)) return "payment";
  return "adjustment";
}

export interface RunningBalanceEntry {
  id: string;
  entryDate: string;
  sequenceNo: number;
  direction: Direction;
  amountPaisa: number;
}

/**
 * Running balance in integer paisa, ordered by entry date then sequence.
 * Debit increases what the customer owes; credit decreases it.
 * Reversed rows stay in the sum — the reversing entry cancels them (BR-3.1).
 */
export function runningBalances(entries: RunningBalanceEntry[]): Map<string, number> {
  const ordered = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.sequenceNo - b.sequenceNo);
  let balance = 0;
  const result = new Map<string, number>();
  for (const entry of ordered) {
    balance += entry.direction === "Dr" ? entry.amountPaisa : -entry.amountPaisa;
    result.set(entry.id, balance);
  }
  return result;
}

export const LEDGER_PAGE_SIZE = 10;

/** Newest entry first (entry date, then sequence), then a customer-list style page. */
export function paginateNewestFirst<T extends { entryDate: string; sequenceNo: number }>(
  entries: T[],
  page = 1,
  pageSize = 20,
): Page<T> {
  const sorted = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.sequenceNo - a.sequenceNo);
  const size = Math.min(Math.max(pageSize, 1), 100);
  const current = Math.max(1, page);
  const start = (current - 1) * size;
  return {
    items: sorted.slice(start, start + size),
    page: current,
    pageSize: size,
    totalCount: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / size)),
  };
}
