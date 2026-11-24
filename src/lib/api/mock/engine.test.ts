import { describe, expect, it } from "vitest";
import { DEMO_TODAY } from "@/lib/date";
import { paisaToMoneyString } from "@/lib/money";
import { ApiError } from "@/lib/problem";
import { balanceInvariantHolds, postEntry, reverseEntry, type EngineActor } from "@/lib/api/mock/engine";
import { IDS, seedDatabase } from "@/lib/api/mock/seed";

const actor: EngineActor = {
  userId: IDS.owner,
  role: "Owner",
  tenantId: IDS.tenant,
  today: DEMO_TODAY,
};

describe("seed balances reconcile", () => {
  const db = seedDatabase();

  it("matches the design totals for the main shop", () => {
    const customers = db.parties.filter((party) => party.tenantId === IDS.tenant && party.partyType === "Customer");
    const receivable = customers.reduce((sum, party) => sum + Math.max(0, party.currentBalancePaisa), 0);
    const suppliers = db.parties.filter((party) => party.tenantId === IDS.tenant && party.partyType === "Supplier");
    const payable = suppliers.reduce((sum, party) => sum + Math.max(0, -party.currentBalancePaisa), 0);
    const collectedToday = db.entries
      .filter((entry) => entry.tenantId === IDS.tenant && entry.entryType === "PaymentReceived" && entry.entryDate === DEMO_TODAY && !entry.isReversed)
      .reduce((sum, entry) => sum + entry.amountPaisa, 0);

    expect(receivable).toBe(14_850_000);
    expect(payable).toBe(3_240_000);
    expect(collectedToday).toBe(1_875_000);
    expect(db.parties.find((party) => party.id === IDS.karim)?.currentBalancePaisa).toBe(1_450_000);
    expect(db.parties.find((party) => party.id === IDS.rafiq)?.currentBalancePaisa).toBe(-300_000);
    expect(db.parties.find((party) => party.id === IDS.salma)?.currentBalancePaisa).toBe(0);
  });

  it("keeps BR-5.8 for every customer", () => {
    for (const party of db.parties.filter((item) => item.partyType === "Customer")) {
      expect(balanceInvariantHolds(db, party.id)).toBe(true);
    }
  });

  it("marks kept and broken promises", () => {
    const tarik = db.promises.find((promise) => promise.partyId === IDS.tarik);
    const nasrin = db.promises.find((promise) => promise.partyId === IDS.nasrin);
    const karim = db.promises.find((promise) => promise.partyId === IDS.karim);
    expect(tarik?.status).toBe("Kept");
    expect(nasrin?.status).toBe("Broken");
    expect(karim?.status).toBe("Open");
  });
});

describe("ledger engine", () => {
  it("gives ৳5,000 credit, receives ৳3,000, and leaves ৳2,000 (FIFO)", () => {
    const db = seedDatabase();
    const created = postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "CreditSale",
      amount: "5000.00",
      entryDate: DEMO_TODAY,
      dueDate: DEMO_TODAY,
      note: "টেস্ট বাকি",
    });
    expect(created.entry.balanceAfterPaisa).toBe(500_000);
    const paid = postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "PaymentReceived",
      amount: "3000.00",
      entryDate: DEMO_TODAY,
      method: "Cash",
    });
    expect(paid.entry.balanceAfterPaisa).toBe(200_000);
    expect(paisaToMoneyString(paid.entry.balanceAfterPaisa)).toBe("2000.00");
    expect(paid.allocations).toHaveLength(1);
    expect(paid.allocations[0]?.amountPaisa).toBe(300_000);
    expect(balanceInvariantHolds(db, IDS.salma)).toBe(true);
  });

  it("turns overpayment into an advance and applies it to the next due", () => {
    const db = seedDatabase();
    postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "CreditSale",
      amount: "1000.00",
      entryDate: DEMO_TODAY,
      dueDate: DEMO_TODAY,
    });
    const over = postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "PaymentReceived",
      amount: "1500.00",
      entryDate: DEMO_TODAY,
      method: "Cash",
    });
    expect(over.entry.balanceAfterPaisa).toBe(-50_000);
    expect(over.unallocatedPaisa).toBe(50_000);
    const next = postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "CreditSale",
      amount: "800.00",
      entryDate: DEMO_TODAY,
      dueDate: DEMO_TODAY,
    });
    expect(next.entry.balanceAfterPaisa).toBe(30_000);
    expect(balanceInvariantHolds(db, IDS.salma)).toBe(true);
    const open = db.dues.filter((due) => due.partyId === IDS.salma && due.status !== "Paid" && due.status !== "Cancelled");
    expect(open.reduce((sum, due) => sum + (due.originalPaisa - due.allocatedPaisa), 0)).toBe(30_000);
  });

  it("reopens a due when its payment is reversed (BR-4.4, BR-5.6)", () => {
    const db = seedDatabase();
    const sale = postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "CreditSale",
      amount: "5000.00",
      entryDate: DEMO_TODAY,
      dueDate: DEMO_TODAY,
    });
    const paid = postEntry(db, { ...actor, skipPolicy: true }, {
      partyId: IDS.salma,
      entryType: "PaymentReceived",
      amount: "5000.00",
      entryDate: DEMO_TODAY,
      method: "Cash",
    });
    expect(db.parties.find((party) => party.id === IDS.salma)?.currentBalancePaisa).toBe(0);
    reverseEntry(db, actor, paid.entry.id, "ভুল এন্ট্রি");
    expect(db.parties.find((party) => party.id === IDS.salma)?.currentBalancePaisa).toBe(500_000);
    expect(paid.entry.isReversed).toBe(true);
    expect(() => reverseEntry(db, actor, paid.entry.id, "আবার")).toThrow(/BR-4.4/);
    expect(balanceInvariantHolds(db, IDS.salma)).toBe(true);
    expect(sale.entry.isReversed).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const db = seedDatabase();
    expect(() =>
      postEntry(db, actor, {
        partyId: IDS.karim,
        entryType: "CreditSale",
        amount: "0.00",
        entryDate: DEMO_TODAY,
      }),
    ).toThrow(ApiError);
  });
});
