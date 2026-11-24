import { beforeEach, describe, expect, it } from "vitest";
import { mockApi } from "@/lib/api/mock/api";
import { IDS } from "@/lib/api/mock/seed";
import { getDb, resetDb } from "@/lib/api/mock/store";

describe("platform admin", () => {
  beforeEach(() => {
    resetDb();
  });

  it("hides admin routes from a shop owner", async () => {
    await mockApi.auth.login({ phone: "01711345678", password: "aadai123" });
    await expect(mockApi.admin.tenants()).rejects.toMatchObject({ status: 403 });
  });

  it("lists shops, changes the plan, marks an invoice paid, and tops up the wallet", async () => {
    const auth = await mockApi.auth.login({ phone: "01611223344", password: "aadai123" });
    expect(auth.user.platformRole).toBe("SuperAdmin");
    const tenants = await mockApi.admin.tenants();
    expect(tenants.map((row) => row.id)).toEqual(expect.arrayContaining([IDS.tenant, IDS.tenant2]));

    const updated = await mockApi.admin.setSubscription(IDS.tenant, IDS.planPremium);
    expect(updated.planName).toBe("Premium");
    expect(updated.maxCustomers).toBe(100_000);

    const invoice = await mockApi.admin.markInvoicePaid("inv_bismillah_open");
    expect(invoice.status).toBe("Paid");
    expect(invoice.paidOn).toBe("2026-11-22");

    const wallet = await mockApi.admin.topUpWallet(IDS.tenant, "500.00");
    expect(wallet.balance).toBe("650.00");
    expect(getDb().walletTx.some((row) => row.type === "TopUp" && row.tenantId === IDS.tenant)).toBe(true);
  });

  it("refuses to delete a plan a shop still uses", async () => {
    await mockApi.auth.login({ phone: "01611223344", password: "aadai123" });
    await expect(mockApi.admin.deletePlan(IDS.planBusiness)).rejects.toMatchObject({ status: 422, code: "PLAN_IN_USE" });
  });

  it("adds a holiday and updates a channel rate", async () => {
    await mockApi.auth.login({ phone: "01611223344", password: "aadai123" });
    const holiday = await mockApi.admin.createHoliday({ date: "2026-12-16", name: "Victory Day extra", nameBn: "বিজয় দিবস নোট" });
    expect((await mockApi.admin.holidays()).some((row) => row.id === holiday.id)).toBe(true);
    const rate = await mockApi.admin.updateChannelRate(IDS.rateSms, "0.60");
    expect(rate.pricePerSegment).toBe("0.60");
  });
});

describe("public statement", () => {
  beforeEach(() => {
    resetDb();
  });

  it("returns the shop brand in the customer's language", async () => {
    const bangla = await mockApi.statements.publicGet("karim-842");
    expect(bangla.language).toBe("bn");
    expect(bangla.businessName).toBe("বিসমিল্লাহ ট্রেডার্স");
    expect(bangla.logoText).toBe("বি");
    expect(bangla.customerName).toContain("করিম");

    const english = await mockApi.statements.publicGet("farhana-en");
    expect(english.language).toBe("en");
    expect(english.businessName).toBe("Bismillah Traders");
    expect(english.customerName).toBe("Farhana Cosmetics");
  });

  it("hides an expired link and records an opt-out", async () => {
    getDb().parties.find((party) => party.statementToken === "karim-842")!.statementExpiresOn = "2020-01-01";
    await expect(mockApi.statements.publicGet("karim-842")).rejects.toMatchObject({ status: 404 });
    resetDb();
    await mockApi.statements.optOut("karim-842");
    const party = getDb().parties.find((item) => item.statementToken === "karim-842");
    expect(party?.smsConsent).toBe("OptedOut");
    expect(party?.whatsAppConsent).toBe("OptedOut");
  });
});
