import { beforeEach, describe, expect, it } from "vitest";
import { mockApi } from "@/lib/api/mock/api";
import { IDS, seedDatabase } from "@/lib/api/mock/seed";
import { resetDb } from "@/lib/api/mock/store";
import { LEDGER_PAGE_SIZE, paginateNewestFirst, runningBalances, type RunningBalanceEntry } from "@/lib/ledger";

function row(
  id: string,
  entryDate: string,
  sequenceNo: number,
  direction: "Dr" | "Cr",
  amountPaisa: number,
): RunningBalanceEntry {
  return { id, entryDate, sequenceNo, direction, amountPaisa };
}

describe("running balance", () => {
  it("adds a credit sale and subtracts a payment, independent of input order", () => {
    const entries = [row("pay", "2026-11-20", 2, "Cr", 300_000), row("sale", "2026-11-02", 1, "Dr", 500_000)];
    const balances = runningBalances(entries);
    expect(balances.get("sale")).toBe(500_000);
    expect(balances.get("pay")).toBe(200_000);
  });

  it("nets a reversed sale with its reversal back to the previous balance", () => {
    const entries = [
      row("sale", "2026-11-02", 1, "Dr", 1_000_000),
      row("mistake", "2026-11-21", 2, "Dr", 250_000),
      row("reversal", "2026-11-22", 3, "Cr", 250_000),
    ];
    const balances = runningBalances(entries);
    expect(balances.get("mistake")).toBe(1_250_000);
    expect(balances.get("reversal")).toBe(1_000_000);
  });

  it("uses sequence number when two entries share a date", () => {
    const balances = runningBalances([
      row("later", "2026-11-22", 2, "Cr", 100_000),
      row("earlier", "2026-11-22", 1, "Dr", 400_000),
    ]);
    expect(balances.get("earlier")).toBe(400_000);
    expect(balances.get("later")).toBe(300_000);
  });

  it("matches every seeded balanceAfter, including reversed rows", () => {
    const db = seedDatabase();
    for (const party of db.parties) {
      const entries = db.entries.filter((entry) => entry.partyId === party.id);
      const balances = runningBalances(
        entries.map((entry) => ({
          id: entry.id,
          entryDate: entry.entryDate,
          sequenceNo: entry.sequenceNo,
          direction: entry.direction,
          amountPaisa: entry.amountPaisa,
        })),
      );
      for (const entry of entries) {
        expect(balances.get(entry.id)).toBe(entry.balanceAfterPaisa);
      }
    }
    const karim = db.entries.filter((entry) => entry.partyId === IDS.karim);
    expect(karim.some((entry) => entry.isReversed)).toBe(true);
    expect(karim.some((entry) => entry.entryType === "Reversal")).toBe(true);
    expect(karim.some((entry) => entry.entryType === "Discount")).toBe(true);
  });
});

describe("ledger page", () => {
  it("returns the newest entries on the first page without changing their running balance", () => {
    const entries = [
      row("old", "2026-09-02", 1, "Dr", 100_000),
      row("mid", "2026-10-02", 2, "Cr", 40_000),
      row("new", "2026-11-02", 3, "Dr", 20_000),
    ];
    const balances = runningBalances(entries);
    const page = paginateNewestFirst(entries, 1, 2);
    expect(page.items.map((entry) => entry.id)).toEqual(["new", "mid"]);
    expect(page.totalCount).toBe(3);
    expect(page.totalPages).toBe(2);
    expect(balances.get("new")).toBe(80_000);
    const older = paginateNewestFirst(entries, 2, 2);
    expect(older.items.map((entry) => entry.id)).toEqual(["old"]);
    expect(balances.get("old")).toBe(100_000);
  });

  beforeEach(() => {
    resetDb();
  });

  it("serves Karim's ledger newest first from the mock API", async () => {
    await mockApi.auth.login({ phone: "01711345678", password: "aadai123" });
    const first = await mockApi.customers.ledger(IDS.karim, { page: 1, pageSize: LEDGER_PAGE_SIZE });
    expect(first.page).toBe(1);
    expect(first.pageSize).toBe(LEDGER_PAGE_SIZE);
    expect(first.totalCount).toBeGreaterThan(LEDGER_PAGE_SIZE);
    expect(first.totalPages).toBe(2);
    expect(first.items[0]?.entryType).toBe("Reversal");
    expect(first.items.some((entry) => entry.isReversed && entry.reversedByDocumentNo)).toBe(true);
    const second = await mockApi.customers.ledger(IDS.karim, { page: 2, pageSize: LEDGER_PAGE_SIZE });
    expect(second.items.length).toBeGreaterThan(0);
    expect(second.items[0]!.entryDate <= first.items.at(-1)!.entryDate).toBe(true);
  });
});
