import { addDays, businessToday, isIsoDate } from "@/lib/date";
import { parseMoneyToPaisa } from "@/lib/money";
import { normalizeBdPhone } from "@/lib/phone";
import { ApiError } from "@/lib/problem";
import { uid, validation, type DbUser } from "@/lib/api/mock/engine";
import { money } from "@/lib/api/mock/map";
import type { AppDatabase, DbInvoice, DbPlan } from "@/lib/api/mock/seed";
import { defaultSettings } from "@/lib/api/mock/seed";
import type {
  AdminInvoice,
  AdminPlan,
  AdminPlanInput,
  AdminTenantDetail,
  AdminTenantInput,
  AdminTenantSummary,
  ChannelRate,
  Holiday,
  HolidayInput,
  SubscriptionStatus,
} from "@/lib/api/types";

const STATUSES: SubscriptionStatus[] = ["Trial", "Active", "PastDue", "Suspended", "Cancelled"];

function planOf(db: AppDatabase, planId: string): DbPlan {
  const plan = db.plans.find((item) => item.id === planId);
  if (!plan) throw new ApiError(404, "NOT_FOUND");
  return plan;
}

function tenantOrThrow(db: AppDatabase, id: string) {
  const tenant = db.tenants.find((item) => item.id === id);
  if (!tenant) throw new ApiError(404, "NOT_FOUND");
  return tenant;
}

function ownerName(db: AppDatabase, tenantId: string): string {
  const membership = db.memberships.find((item) => item.tenantId === tenantId && item.role === "Owner" && item.isActive);
  const user = db.users.find((item) => item.id === membership?.userId);
  return user?.fullName ?? "";
}

function customerCount(db: AppDatabase, tenantId: string): number {
  return db.parties.filter((party) => party.tenantId === tenantId && party.partyType === "Customer" && !party.isDeleted).length;
}

function walletBalance(db: AppDatabase, tenantId: string): number {
  return db.wallets.find((item) => item.tenantId === tenantId)?.balancePaisa ?? 0;
}

function mapInvoice(db: AppDatabase, invoice: DbInvoice): AdminInvoice {
  const tenant = db.tenants.find((item) => item.id === invoice.tenantId);
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    tenantName: tenant?.nameBn ?? "",
    number: invoice.number,
    amount: money(invoice.amountPaisa),
    status: invoice.status,
    issuedOn: invoice.issuedOn,
    paidOn: invoice.paidOn,
    note: invoice.note,
  };
}

function mapPlan(plan: DbPlan): AdminPlan {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    nameBn: plan.nameBn,
    monthlyPrice: money(plan.monthlyPricePaisa),
    maxCustomers: plan.maxCustomers,
    includedCredits: money(plan.includedCreditsPaisa),
    isActive: plan.isActive,
  };
}

export function mapTenantSummary(db: AppDatabase, tenantId: string): AdminTenantSummary {
  const tenant = tenantOrThrow(db, tenantId);
  return {
    id: tenant.id,
    name: tenant.name,
    nameBn: tenant.nameBn,
    phoneE164: tenant.phoneE164,
    status: tenant.status,
    planId: tenant.planId ?? "",
    planName: tenant.planName,
    ownerName: ownerName(db, tenant.id),
    customerCount: customerCount(db, tenant.id),
    walletBalance: money(walletBalance(db, tenant.id)),
    trialEndsOn: tenant.trialEndsOn,
  };
}

export function mapTenantDetail(db: AppDatabase, tenantId: string): AdminTenantDetail {
  const tenant = tenantOrThrow(db, tenantId);
  return {
    ...mapTenantSummary(db, tenantId),
    address: tenant.address,
    email: tenant.email,
    maxCustomers: tenant.maxCustomers,
    invoices: db.invoices.filter((item) => item.tenantId === tenant.id).map((item) => mapInvoice(db, item)),
  };
}

function positivePaisa(value: string, field: string): number {
  let paisa: number;
  try {
    paisa = parseMoneyToPaisa(value);
  } catch {
    throw validation({ [field]: ["AMOUNT_INVALID"] });
  }
  if (paisa <= 0) throw validation({ [field]: ["AMOUNT_INVALID"] });
  return paisa;
}

function readPlanInput(body: AdminPlanInput): Omit<DbPlan, "id"> {
  if (!body.code.trim() || !body.name.trim() || !body.nameBn.trim()) throw validation({ name: ["REQUIRED"] });
  if (!Number.isInteger(body.maxCustomers) || body.maxCustomers < 1) throw validation({ maxCustomers: ["AMOUNT_INVALID"] });
  return {
    code: body.code.trim(),
    name: body.name.trim(),
    nameBn: body.nameBn.trim(),
    monthlyPricePaisa: positivePaisa(body.monthlyPrice, "monthlyPrice"),
    maxCustomers: body.maxCustomers,
    includedCreditsPaisa: positivePaisa(body.includedCredits, "includedCredits"),
    isActive: body.isActive,
  };
}

export function listTenantSummaries(db: AppDatabase): AdminTenantSummary[] {
  return db.tenants.map((tenant) => mapTenantSummary(db, tenant.id));
}

export function createTenantRecord(db: AppDatabase, body: AdminTenantInput): AdminTenantDetail {
  if (!body.name.trim() || !body.nameBn.trim() || !body.ownerName.trim()) throw validation({ name: ["REQUIRED"] });
  let phone: string;
  try {
    phone = normalizeBdPhone(body.phone);
  } catch {
    throw validation({ phone: ["PHONE_INVALID"] });
  }
  const plan = planOf(db, body.planId);
  const tenantId = uid();
  db.tenants.push({
    id: tenantId,
    name: body.name.trim(),
    nameBn: body.nameBn.trim(),
    businessType: "দোকান",
    phoneE164: phone,
    address: body.address?.trim() || "",
    logoText: body.nameBn.trim().slice(0, 1),
    status: "Trial",
    trialEndsOn: addDays(businessToday(), 14),
    planId: plan.id,
    planName: plan.name,
    maxCustomers: plan.maxCustomers,
    settings: defaultSettings(),
  });
  let user = db.users.find((item) => item.phoneE164 === phone);
  if (!user) {
    user = {
      id: uid(),
      phoneE164: phone,
      fullName: body.ownerName.trim(),
      password: "aadai123",
      preferredLanguage: "bn",
      status: "Active",
    } satisfies DbUser;
    db.users.push(user);
  }
  db.memberships.push({ id: uid(), tenantId, userId: user.id, role: "Owner", isActive: true, subtitle: "প্রধান অ্যাকাউন্ট" });
  db.wallets.push({ tenantId, balancePaisa: plan.includedCreditsPaisa, reservedPaisa: 0, thresholdPaisa: 20_000 });
  if (plan.includedCreditsPaisa > 0) {
    db.walletTx.unshift({
      id: uid(),
      tenantId,
      type: "PlanCredit",
      amountPaisa: plan.includedCreditsPaisa,
      balanceAfterPaisa: plan.includedCreditsPaisa,
      note: "প্ল্যান ক্রেডিট",
      createdAtUtc: new Date().toISOString(),
    });
  }
  return mapTenantDetail(db, tenantId);
}

export function setTenantStatus(db: AppDatabase, id: string, status: SubscriptionStatus): AdminTenantDetail {
  if (!STATUSES.includes(status)) throw validation({ status: ["REQUIRED"] });
  tenantOrThrow(db, id).status = status;
  return mapTenantDetail(db, id);
}

export function setTenantSubscription(db: AppDatabase, id: string, planId: string): AdminTenantDetail {
  const tenant = tenantOrThrow(db, id);
  const plan = planOf(db, planId);
  tenant.planId = plan.id;
  tenant.planName = plan.name;
  tenant.maxCustomers = plan.maxCustomers;
  return mapTenantDetail(db, id);
}

export function createInvoiceRecord(db: AppDatabase, tenantId: string, body: { amount: string; note?: string }): AdminInvoice {
  tenantOrThrow(db, tenantId);
  const amountPaisa = positivePaisa(body.amount, "amount");
  const year = businessToday().slice(0, 4);
  const sequence = db.invoices.filter((item) => item.number.startsWith(`INV-${year}-`)).length + 1;
  const invoice: DbInvoice = {
    id: uid(),
    tenantId,
    number: `INV-${year}-${String(sequence).padStart(3, "0")}`,
    amountPaisa,
    status: "Open",
    issuedOn: businessToday(),
    note: body.note?.trim() || undefined,
  };
  db.invoices.unshift(invoice);
  return mapInvoice(db, invoice);
}

export function listInvoices(db: AppDatabase): AdminInvoice[] {
  return db.invoices.map((item) => mapInvoice(db, item));
}

export function markInvoicePaid(db: AppDatabase, id: string): AdminInvoice {
  const invoice = db.invoices.find((item) => item.id === id);
  if (!invoice) throw new ApiError(404, "NOT_FOUND");
  if (invoice.status !== "Paid") {
    invoice.status = "Paid";
    invoice.paidOn = businessToday();
    const tenant = tenantOrThrow(db, invoice.tenantId);
    if (tenant.status === "PastDue" || tenant.status === "Trial") tenant.status = "Active";
  }
  return mapInvoice(db, invoice);
}

export function topUpWallet(db: AppDatabase, tenantId: string, amount: string): { balance: string } {
  tenantOrThrow(db, tenantId);
  const paisa = positivePaisa(amount, "amount");
  let wallet = db.wallets.find((item) => item.tenantId === tenantId);
  if (!wallet) {
    wallet = { tenantId, balancePaisa: 0, reservedPaisa: 0, thresholdPaisa: 20_000 };
    db.wallets.push(wallet);
  }
  wallet.balancePaisa += paisa;
  db.walletTx.unshift({
    id: uid(),
    tenantId,
    type: "TopUp",
    amountPaisa: paisa,
    balanceAfterPaisa: wallet.balancePaisa,
    note: "অ্যাডমিন টপ-আপ",
    createdAtUtc: new Date().toISOString(),
  });
  return { balance: money(wallet.balancePaisa) };
}

export function listPlans(db: AppDatabase): AdminPlan[] {
  return db.plans.map(mapPlan);
}

export function createPlanRecord(db: AppDatabase, body: AdminPlanInput): AdminPlan {
  const input = readPlanInput(body);
  if (db.plans.some((plan) => plan.code.toLowerCase() === input.code.toLowerCase())) throw validation({ code: ["DUPLICATE"] });
  const plan: DbPlan = { id: uid(), ...input };
  db.plans.push(plan);
  return mapPlan(plan);
}

export function updatePlanRecord(db: AppDatabase, id: string, body: AdminPlanInput): AdminPlan {
  const plan = planOf(db, id);
  const input = readPlanInput(body);
  if (db.plans.some((item) => item.id !== id && item.code.toLowerCase() === input.code.toLowerCase())) {
    throw validation({ code: ["DUPLICATE"] });
  }
  Object.assign(plan, input);
  return mapPlan(plan);
}

export function deletePlanRecord(db: AppDatabase, id: string): void {
  const plan = planOf(db, id);
  if (db.tenants.some((tenant) => tenant.planId === plan.id)) throw new ApiError(422, "PLAN_IN_USE");
  db.plans.splice(db.plans.indexOf(plan), 1);
}

export function listChannelRates(db: AppDatabase): ChannelRate[] {
  return db.channelRates.map((rate) => ({ id: rate.id, channel: rate.channel, pricePerSegment: money(rate.pricePaisa) }));
}

export function updateChannelRateRecord(db: AppDatabase, id: string, pricePerSegment: string): ChannelRate {
  const rate = db.channelRates.find((item) => item.id === id);
  if (!rate) throw new ApiError(404, "NOT_FOUND");
  rate.pricePaisa = positivePaisa(pricePerSegment, "pricePerSegment");
  return { id: rate.id, channel: rate.channel, pricePerSegment: money(rate.pricePaisa) };
}

export function listHolidays(db: AppDatabase): Holiday[] {
  return db.holidays
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({ id: item.id, date: item.date, name: item.name, nameBn: item.nameBn }));
}

export function createHolidayRecord(db: AppDatabase, body: HolidayInput): Holiday {
  if (!isIsoDate(body.date)) throw validation({ date: ["DATE_INVALID"] });
  if (!body.name.trim() || !body.nameBn.trim()) throw validation({ name: ["REQUIRED"] });
  if (db.holidays.some((item) => item.date === body.date && item.nameBn === body.nameBn.trim())) {
    throw validation({ date: ["HOLIDAY_DUPLICATE"] });
  }
  const holiday = { id: uid(), date: body.date, name: body.name.trim(), nameBn: body.nameBn.trim() };
  db.holidays.push(holiday);
  return holiday;
}

export function deleteHolidayRecord(db: AppDatabase, id: string): void {
  const index = db.holidays.findIndex((item) => item.id === id);
  if (index < 0) throw new ApiError(404, "NOT_FOUND");
  db.holidays.splice(index, 1);
}
