import { addDays, businessToday, diffDays, isIsoDate, lastNDays } from "@/lib/date";
import { parseMoneyToPaisa } from "@/lib/money";
import { normalizeBdPhone } from "@/lib/phone";
import { can, type Permission, type Role } from "@/lib/permissions";
import { ApiError } from "@/lib/problem";
import { messageCostPaisa, smsSegments } from "@/lib/sms";
import { renderTemplate } from "@/lib/templates";
import type { ApiClient } from "@/lib/api/client";
import {
  allocationPreview,
  businessError,
  correctEntry,
  customerDpd,
  evaluatePromises,
  openDues,
  overduePaisa,
  partyById,
  postEntry,
  reverseEntry,
  toAllocationResults,
  uid,
  validation,
  type EngineActor,
} from "@/lib/api/mock/engine";
import {
  agingReport,
  localizedAmount,
  localizedDate,
  mapAudit,
  mapCustomer,
  mapEntry,
  mapMember,
  mapMessage,
  mapPromise,
  meFrom,
  money,
} from "@/lib/api/mock/map";
import type { DbParty } from "@/lib/api/mock/engine";
import type { AppDatabase, DbTemplate } from "@/lib/api/mock/seed";
import { DEMO_PASSWORD_VALUE } from "@/lib/api/mock/seed";
import {
  createHolidayRecord,
  createInvoiceRecord,
  createPlanRecord,
  createTenantRecord,
  deleteHolidayRecord,
  deletePlanRecord,
  listChannelRates,
  listHolidays,
  listInvoices,
  listPlans,
  listTenantSummaries,
  mapTenantDetail,
  markInvoicePaid,
  setTenantStatus,
  setTenantSubscription,
  topUpWallet,
  updateChannelRateRecord,
  updatePlanRecord,
} from "@/lib/api/mock/admin";
import { resetDb, withDb } from "@/lib/api/mock/store";
import { getAccessToken, issueRefreshToken, issueToken, readToken, setAccessToken } from "@/lib/api/token";
import type { CustomerQuery, LedgerWriteResult } from "@/lib/api/types";

function actorOf(db: AppDatabase): EngineActor {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, "UNAUTHORIZED");
  let payload: ReturnType<typeof readToken>;
  try {
    payload = readToken(token);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED");
  }
  if (payload.exp * 1000 < Date.now()) throw new ApiError(401, "UNAUTHORIZED");
  const membership = db.memberships.find(
    (item) => item.userId === payload.sub && item.tenantId === payload.tid && item.isActive,
  );
  if (!membership) throw new ApiError(403, "FORBIDDEN");
  return { userId: payload.sub, role: membership.role, tenantId: payload.tid, today: businessToday() };
}

function platformActor(db: AppDatabase) {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, "UNAUTHORIZED");
  let payload: ReturnType<typeof readToken>;
  try {
    payload = readToken(token);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED");
  }
  if (payload.exp * 1000 < Date.now()) throw new ApiError(401, "UNAUTHORIZED");
  const user = db.users.find((item) => item.id === payload.sub);
  if (!user?.platformRole) throw new ApiError(403, "FORBIDDEN");
  return user;
}

function requirePerm(actor: EngineActor, permission: Permission): void {
  if (!can(actor.role, permission)) throw new ApiError(403, "FORBIDDEN");
}

function tenantOf(db: AppDatabase, tenantId: string) {
  const tenant = db.tenants.find((item) => item.id === tenantId);
  if (!tenant) throw new ApiError(404, "NOT_FOUND");
  return tenant;
}

function assertWritable(db: AppDatabase, actor: EngineActor): void {
  const status = tenantOf(db, actor.tenantId).status;
  if (status === "Suspended" || status === "Cancelled") throw new ApiError(402, "SUBSCRIPTION_INACTIVE");
}

function audit(
  db: AppDatabase,
  actor: EngineActor,
  action: string,
  entityType: string,
  entityId: string,
  before?: Record<string, string>,
  after?: Record<string, string>,
): void {
  db.audit.unshift({
    id: uid(),
    tenantId: actor.tenantId,
    userId: actor.userId,
    action,
    entityType,
    entityId,
    before,
    after,
    atUtc: new Date().toISOString(),
  });
}

function authResult(db: AppDatabase, userId: string, tenantId: string, role: Role) {
  const accessToken = issueToken({ sub: userId, tid: tenantId, role, exp: Math.floor(Date.now() / 1000) + 60 * 30 });
  const refreshToken = issueRefreshToken();
  db.sessions.unshift({
    id: uid(),
    userId,
    tenantId,
    refreshToken,
    deviceName: "Web",
    platform: "Web",
    createdAtUtc: new Date().toISOString(),
    lastSeenAtUtc: new Date().toISOString(),
  });
  setAccessToken(accessToken);
  return { accessToken, refreshToken, expiresIn: 1800, user: meFrom(db, userId, tenantId) };
}

function scopedParties(db: AppDatabase, actor: EngineActor, partyType: "Customer" | "Supplier"): DbParty[] {
  const tenant = tenantOf(db, actor.tenantId);
  return db.parties.filter((party) => {
    if (party.tenantId !== actor.tenantId || party.partyType !== partyType || party.isDeleted) return false;
    if (actor.role === "Collector" && partyType === "Customer" && !tenant.settings.collectorCanSeeAll) {
      return party.assignedCollectorId === actor.userId;
    }
    if (actor.role === "Collector" && partyType === "Supplier") return false;
    return true;
  });
}

function queryParties(db: AppDatabase, actor: EngineActor, partyType: "Customer" | "Supplier", query: CustomerQuery = {}) {
  let rows = scopedParties(db, actor, partyType);
  if (!query.includeArchived) rows = rows.filter((party) => !party.isArchived);
  const today = actor.today;
  if (query.search?.trim()) {
    const needle = query.search.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    rows = rows.filter((party) => {
      const phone = party.phoneE164.replace(/\D/g, "");
      return (
        party.name.toLowerCase().includes(needle) ||
        (party.nameEn?.toLowerCase().includes(needle) ?? false) ||
        party.code.toLowerCase().includes(needle) ||
        (digits.length >= 3 && phone.includes(digits))
      );
    });
  }
  if (query.groupId) rows = rows.filter((party) => party.groupId === query.groupId);
  if (query.area) rows = rows.filter((party) => party.area === query.area);
  if (query.collectorId) rows = rows.filter((party) => party.assignedCollectorId === query.collectorId);
  const mapped = rows.map((party) => mapCustomer(db, party, today));
  const filtered = mapped.filter((customer) => {
    if (query.filter === "overdue") return customer.status === "overdue";
    if (query.filter === "due") return customer.balance.startsWith("-") ? false : Number(customer.balance) > 0 || parseMoneyToPaisa(customer.balance) > 0;
    if (query.filter === "settled") return customer.status === "settled" || customer.status === "advance";
    return true;
  });
  const direction = query.direction === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    if (query.sort === "name") return a.name.localeCompare(b.name, "bn") * (query.direction === "desc" ? -1 : 1);
    if (query.sort === "dpd") return ((a.dpd ?? -1) - (b.dpd ?? -1)) * direction;
    return (parseMoneyToPaisa(a.balance) - parseMoneyToPaisa(b.balance)) * direction;
  });
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? 20, 100);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

function remember<T>(db: AppDatabase, actor: EngineActor, key: string, hash: string, produce: () => T): T {
  const existing = db.idempotency.find((item) => item.tenantId === actor.tenantId && item.key === key);
  if (existing) {
    if (existing.hash !== hash) throw new ApiError(409, "IDEMPOTENCY_CONFLICT");
    return JSON.parse(existing.responseJson) as T;
  }
  const value = produce();
  db.idempotency.push({ tenantId: actor.tenantId, key, hash, responseJson: JSON.stringify(value) });
  return value;
}

function writeResult(db: AppDatabase, result: ReturnType<typeof postEntry>): LedgerWriteResult {
  return {
    entryId: result.entry.id,
    documentNo: result.entry.documentNo,
    balanceAfter: money(result.entry.balanceAfterPaisa),
    allocations: toAllocationResults(db, result.allocations),
    unallocated: money(result.unallocatedPaisa),
    creditLimitExceeded: result.creditLimitExceeded || undefined,
    possibleDuplicate: result.possibleDuplicate || undefined,
    promiseUpdated: result.promiseUpdated,
  };
}

function templateVars(db: AppDatabase, party: DbParty, extra: Record<string, string> = {}): Record<string, string> {
  const tenant = tenantOf(db, party.tenantId);
  const language = party.preferredLanguage;
  const today = businessToday();
  const open = db.promises.find((item) => item.partyId === party.id && item.status === "Open");
  const last = db.entries
    .filter((entry) => entry.partyId === party.id && entry.entryType === "PaymentReceived" && !entry.isReversed)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0];
  return {
    customer_name: party.name,
    business_name: language === "bn" ? tenant.nameBn : tenant.name,
    balance: localizedAmount(Math.max(0, party.currentBalancePaisa), language),
    overdue_amount: localizedAmount(overduePaisa(db, party.id, today), language),
    due_date: party ? localizedDate(openDues(db, party.id)[0]?.dueDate ?? today, language) : "",
    last_payment_amount: last ? localizedAmount(last.amountPaisa, language) : "",
    last_payment_date: last ? localizedDate(last.entryDate, language) : "",
    statement_link: party.statementToken ? `aadai.bd/s/${party.statementToken}` : "aadai.bd/s",
    promise_amount: open ? localizedAmount(open.amountPaisa, language) : "",
    promise_date: open ? localizedDate(open.promiseDate, language) : "",
    business_phone: tenant.phoneE164,
    ...extra,
  };
}

function dispatchMessage(
  db: AppDatabase,
  actor: EngineActor,
  party: DbParty,
  channel: "Sms" | "WhatsApp",
  body: string,
  trigger: "Manual" | "Bulk" | "Rule" | "Transaction" | "System",
  templateId?: string,
): ReturnType<typeof mapMessage> {
  const wallet = db.wallets.find((item) => item.tenantId === actor.tenantId)!;
  const consent = channel === "Sms" ? party.smsConsent : party.whatsAppConsent;
  const segments = channel === "Sms" ? smsSegments(body).segments : 1;
  const cost = messageCostPaisa(channel, body);
  let status: "Sent" | "Blocked" = "Sent";
  let failure: string | undefined;
  if (consent === "OptedOut") {
    status = "Blocked";
    failure = "OPTED_OUT";
  } else if (wallet.balancePaisa < cost) {
    status = "Blocked";
    failure = "INSUFFICIENT_CREDIT";
  } else {
    wallet.balancePaisa -= cost;
    db.walletTx.unshift({
      id: uid(),
      tenantId: actor.tenantId,
      type: "Capture",
      amountPaisa: -cost,
      balanceAfterPaisa: wallet.balancePaisa,
      note: channel,
      createdAtUtc: new Date().toISOString(),
    });
  }
  const message = {
    id: uid(),
    tenantId: actor.tenantId,
    partyId: party.id,
    channel,
    language: party.preferredLanguage,
    templateId,
    renderedBody: body,
    toPhoneE164: party.phoneE164,
    status,
    failureReason: failure,
    segments,
    costPaisa: status === "Sent" ? cost : 0,
    triggerType: trigger,
    createdAtUtc: new Date().toISOString(),
    createdBy: actor.userId,
    attempts: 1,
  };
  db.messages.unshift(message);
  return mapMessage(db, message);
}

function renderFor(db: AppDatabase, template: DbTemplate, party: DbParty, extra?: Record<string, string>): string {
  return renderTemplate(template.body, templateVars(db, party, extra), { banglaNumerals: false });
}

function ensureStatement(party: DbParty, today: string): void {
  if (!party.statementToken) {
    party.statementToken = uid().replace(/-/g, "").slice(0, 10);
  }
  party.statementExpiresOn = addDays(today, 30);
}

function activeCustomers(db: AppDatabase, tenantId: string): number {
  return db.parties.filter((party) => party.tenantId === tenantId && party.partyType === "Customer" && !party.isDeleted && !party.isArchived).length;
}

export const mockApi: ApiClient = {
  auth: {
    async requestOtp(body) {
      return withDb((db) => {
        let phone: string;
        try {
          phone = normalizeBdPhone(body.phone);
        } catch {
          throw validation({ phone: ["PHONE_INVALID"] });
        }
        const recent = db.otps.filter((item) => item.phoneE164 === phone && item.expiresAt > Date.now() - 60_000);
        if (recent.length >= 3) throw new ApiError(429, "RATE_LIMITED");
        db.otps.push({ id: uid(), phoneE164: phone, purpose: body.purpose, code: "123456", expiresAt: Date.now() + 5 * 60_000, attempts: 0, consumed: false });
        return { expiresInSeconds: 300, retryAfterSeconds: 60, devCode: "123456" };
      });
    },
    async verifyOtp(body) {
      return withDb((db) => {
        const phone = normalizeBdPhone(body.phone);
        const otp = [...db.otps].reverse().find((item) => item.phoneE164 === phone && item.purpose === body.purpose && !item.consumed);
        if (!otp || otp.expiresAt < Date.now()) throw validation({ code: ["OTP_EXPIRED"] });
        otp.attempts += 1;
        if (otp.attempts > 5) throw validation({ code: ["OTP_LOCKED"] });
        if (otp.code !== body.code.trim()) throw validation({ code: ["OTP_INVALID"] });
        otp.consumed = true;
        const user = db.users.find((item) => item.phoneE164 === phone);
        if (body.purpose === "login") {
          if (!user) throw validation({ phone: ["UNKNOWN_PHONE"] });
          const membership = db.memberships.find((item) => item.userId === user.id && item.isActive);
          if (!membership) throw new ApiError(403, "FORBIDDEN");
          return { auth: authResult(db, user.id, membership.tenantId, membership.role) };
        }
        const ticket = uid();
        db.tickets.push({ id: ticket, phoneE164: phone, purpose: body.purpose === "reset" ? "reset" : "signup", expiresAt: Date.now() + 15 * 60_000, consumed: false });
        return { ticket };
      });
    },
    async signup(body) {
      return withDb((db) => {
        const ticket = db.tickets.find((item) => item.id === body.ticket && !item.consumed && item.purpose === "signup");
        if (!ticket || ticket.expiresAt < Date.now()) throw validation({ ticket: ["TICKET_EXPIRED"] });
        if (!body.fullName.trim() || !body.businessName.trim()) throw validation({ fullName: ["REQUIRED"], businessName: ["REQUIRED"] });
        if (body.password.length < 6) throw validation({ password: ["PASSWORD_SHORT"] });
        ticket.consumed = true;
        let user = db.users.find((item) => item.phoneE164 === ticket.phoneE164);
        if (!user) {
          user = { id: uid(), phoneE164: ticket.phoneE164, fullName: body.fullName.trim(), password: body.password, preferredLanguage: body.language ?? "bn", status: "Active" };
          db.users.push(user);
        } else {
          user.fullName = body.fullName.trim();
          user.password = body.password;
        }
        const tenantId = uid();
        db.tenants.push({
          id: tenantId,
          name: body.businessName.trim(),
          nameBn: body.businessNameBn?.trim() || body.businessName.trim(),
          businessType: body.businessType?.trim() || "দোকান",
          phoneE164: ticket.phoneE164,
          address: body.address?.trim() || "",
          logoText: (body.businessNameBn || body.businessName).trim().slice(0, 1),
          status: "Trial",
          trialEndsOn: addDays(businessToday(), 14),
          planId: db.plans.find((plan) => plan.code === "Business")?.id,
          planName: "Business",
          maxCustomers: db.plans.find((plan) => plan.code === "Business")?.maxCustomers ?? 500,
          settings: tenantOf(db, db.tenants[0]?.id ?? tenantId).settings
            ? { ...db.tenants[0]!.settings, defaultCreditDays: body.defaultCreditDays ?? 7 }
            : db.tenants[0]!.settings,
        });
        db.memberships.push({ id: uid(), tenantId, userId: user.id, role: "Owner", isActive: true, subtitle: "প্রধান অ্যাকাউন্ট" });
        db.wallets.push({ tenantId, balancePaisa: 5_000, reservedPaisa: 0, thresholdPaisa: 20_000 });
        db.rules.push(
          ...db.rules
            .filter((rule) => rule.tenantId === db.tenants[0]!.id)
            .map((rule) => ({ ...rule, id: uid(), tenantId })),
        );
        return authResult(db, user.id, tenantId, "Owner");
      });
    },
    async login(body) {
      return withDb((db) => {
        let phone: string;
        try {
          phone = normalizeBdPhone(body.phone);
        } catch {
          throw validation({ phone: ["PHONE_INVALID"] });
        }
        const user = db.users.find((item) => item.phoneE164 === phone);
        if (!user || user.password !== body.password) throw new ApiError(401, "BAD_CREDENTIALS");
        const membership = db.memberships.find((item) => item.userId === user.id && item.isActive);
        if (!membership) throw new ApiError(403, "FORBIDDEN");
        return authResult(db, user.id, membership.tenantId, membership.role);
      });
    },
    async refresh(body) {
      return withDb((db) => {
        const session = db.sessions.find((item) => item.refreshToken === body.refreshToken && !item.revokedAtUtc);
        if (!session) throw new ApiError(401, "UNAUTHORIZED");
        const membership = db.memberships.find((item) => item.userId === session.userId && item.tenantId === session.tenantId && item.isActive);
        if (!membership) throw new ApiError(403, "FORBIDDEN");
        session.revokedAtUtc = new Date().toISOString();
        return authResult(db, session.userId, session.tenantId, membership.role);
      });
    },
    async logout() {
      return withDb((db) => {
        const token = getAccessToken();
        if (token) {
          try {
            const payload = readToken(token);
            for (const session of db.sessions.filter((item) => item.userId === payload.sub && !item.revokedAtUtc)) {
              session.revokedAtUtc = new Date().toISOString();
            }
          } catch {
            /* ignore */
          }
        }
        setAccessToken(null);
      });
    },
    async resetPassword(body) {
      return withDb((db) => {
        const ticket = db.tickets.find((item) => item.id === body.ticket && item.purpose === "reset" && !item.consumed);
        if (!ticket || ticket.expiresAt < Date.now()) throw validation({ ticket: ["TICKET_EXPIRED"] });
        if (body.newPassword.length < 6) throw validation({ newPassword: ["PASSWORD_SHORT"] });
        const user = db.users.find((item) => item.phoneE164 === ticket.phoneE164);
        if (!user) throw new ApiError(404, "NOT_FOUND");
        user.password = body.newPassword;
        ticket.consumed = true;
      });
    },
    async changePassword(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        const user = db.users.find((item) => item.id === actor.userId)!;
        if (user.password !== body.current) throw validation({ current: ["BAD_PASSWORD"] });
        if (body.newPassword.length < 6) throw validation({ newPassword: ["PASSWORD_SHORT"] });
        user.password = body.newPassword;
      });
    },
    async switchTenant(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        const membership = db.memberships.find((item) => item.userId === actor.userId && item.tenantId === body.tenantId && item.isActive);
        if (!membership) throw new ApiError(404, "NOT_FOUND");
        return authResult(db, actor.userId, membership.tenantId, membership.role);
      });
    },
    async me() {
      return withDb((db) => {
        const actor = actorOf(db);
        return meFrom(db, actor.userId, actor.tenantId);
      });
    },
    async updateMe(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        const user = db.users.find((item) => item.id === actor.userId)!;
        if (body.fullName) user.fullName = body.fullName.trim();
        if (body.email !== undefined) user.email = body.email;
        if (body.preferredLanguage) user.preferredLanguage = body.preferredLanguage;
        return meFrom(db, actor.userId, actor.tenantId);
      });
    },
    async sessions() {
      return withDb((db) => {
        const actor = actorOf(db);
        const token = getAccessToken();
        return db.sessions
          .filter((item) => item.userId === actor.userId && !item.revokedAtUtc)
          .map((item, index) => ({
            id: item.id,
            deviceName: item.deviceName,
            platform: item.platform,
            createdAtUtc: item.createdAtUtc,
            lastSeenAtUtc: item.lastSeenAtUtc,
            current: index === 0 && Boolean(token),
          }));
      });
    },
    async revokeSession(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const session = db.sessions.find((item) => item.id === id && item.userId === actor.userId);
        if (!session) throw new ApiError(404, "NOT_FOUND");
        session.revokedAtUtc = new Date().toISOString();
      });
    },
  },
  customers: {
    async list(query) {
      return withDb((db) => queryParties(db, actorOf(db), "Customer", query));
    },
    async get(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const party = partyById(db, id, actor.tenantId);
        if (party.partyType !== "Customer") throw new ApiError(404, "NOT_FOUND");
        if (!scopedParties(db, actor, "Customer").some((item) => item.id === id)) throw new ApiError(404, "NOT_FOUND");
        return mapCustomer(db, party, actor.today);
      });
    },
    async create(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        assertWritable(db, actor);
        const tenant = tenantOf(db, actor.tenantId);
        if (activeCustomers(db, actor.tenantId) >= tenant.maxCustomers) throw new ApiError(402, "PLAN_LIMIT_REACHED");
        if (!body.name.trim()) throw validation({ name: ["REQUIRED"] });
        let phone: string;
        try {
          phone = normalizeBdPhone(body.phone);
        } catch {
          throw validation({ phone: ["PHONE_INVALID"] });
        }
        const duplicate = db.parties.find((party) => party.tenantId === actor.tenantId && party.partyType === "Customer" && party.phoneE164 === phone && !party.isDeleted);
        if (duplicate) throw new ApiError(409, "DUPLICATE_PHONE", { errors: { phone: ["DUPLICATE_PHONE"] } });
        const count = db.parties.filter((party) => party.tenantId === actor.tenantId && party.partyType === "Customer").length + 1;
        const party: DbParty = {
          id: uid(),
          tenantId: actor.tenantId,
          partyType: "Customer",
          code: `C-${String(count).padStart(3, "0")}`,
          name: body.name.trim(),
          nameEn: body.nameEn?.trim(),
          phoneE164: phone,
          altPhoneE164: body.altPhone ? normalizeBdPhone(body.altPhone) : undefined,
          address: body.address?.trim(),
          area: body.area?.trim() || "",
          groupId: body.groupId,
          creditLimitPaisa: body.creditLimit ? parseMoneyToPaisa(body.creditLimit) : 0,
          creditDays: body.creditDays ?? tenant.settings.defaultCreditDays,
          preferredLanguage: body.preferredLanguage ?? "bn",
          preferredChannel: body.preferredChannel ?? "WhatsApp",
          assignedCollectorId: body.assignedCollectorId,
          notes: body.notes,
          currentBalancePaisa: 0,
          doNotRemind: false,
          smsConsent: "OptedIn",
          whatsAppConsent: "OptedIn",
          isArchived: false,
          isDeleted: false,
          rowVersion: 1,
          createdAtUtc: new Date().toISOString(),
        };
        db.parties.push(party);
        if (body.openingBalance && parseMoneyToPaisa(body.openingBalance) > 0) {
          postEntry(db, actor, {
            partyId: party.id,
            entryType: "OpeningBalance",
            amount: body.openingBalance,
            entryDate: actor.today,
            dueDate: body.openingDueDate,
            note: "প্রারম্ভিক বাকি",
          });
        }
        audit(db, actor, "customer.create", "Party", party.id, undefined, { name: party.name, phone: party.phoneE164 });
        return mapCustomer(db, party, actor.today);
      });
    },
    async update(id, body, rowVersion) {
      return withDb((db) => {
        const actor = actorOf(db);
        const party = partyById(db, id, actor.tenantId);
        if (String(party.rowVersion) !== rowVersion) throw new ApiError(409, "CONCURRENCY_CONFLICT");
        const before = { name: party.name, phone: party.phoneE164, area: party.area };
        if (actor.role === "Collector") {
          if (!can(actor.role, "customers.editLimited")) throw new ApiError(403, "FORBIDDEN");
          if (party.assignedCollectorId !== actor.userId) throw new ApiError(404, "NOT_FOUND");
          if (body.phone) party.phoneE164 = normalizeBdPhone(body.phone);
          if (body.address !== undefined) party.address = body.address;
          if (body.area !== undefined) party.area = body.area;
        } else {
          requirePerm(actor, "customers.write");
          assertWritable(db, actor);
          party.name = body.name.trim();
          party.nameEn = body.nameEn?.trim();
          party.phoneE164 = normalizeBdPhone(body.phone);
          party.address = body.address;
          party.area = body.area?.trim() || "";
          party.groupId = body.groupId;
          party.creditDays = body.creditDays ?? party.creditDays;
          if (body.creditLimit) party.creditLimitPaisa = parseMoneyToPaisa(body.creditLimit);
          if (body.preferredLanguage) party.preferredLanguage = body.preferredLanguage;
          if (body.preferredChannel) party.preferredChannel = body.preferredChannel;
          party.assignedCollectorId = body.assignedCollectorId;
          party.notes = body.notes;
        }
        party.rowVersion += 1;
        audit(db, actor, "customer.update", "Party", party.id, before, { name: party.name, phone: party.phoneE164, area: party.area });
        return mapCustomer(db, party, actor.today);
      });
    },
    async remove(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.delete");
        const party = partyById(db, id, actor.tenantId);
        if (party.currentBalancePaisa !== 0) throw businessError("BR-4.6");
        party.isDeleted = true;
        audit(db, actor, "customer.delete", "Party", party.id, { name: party.name }, { isDeleted: "true" });
      });
    },
    async archive(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.delete");
        const party = partyById(db, id, actor.tenantId);
        party.isArchived = !party.isArchived;
        party.rowVersion += 1;
        return mapCustomer(db, party, actor.today);
      });
    },
    async checkDuplicate(phone) {
      return withDb((db) => {
        const actor = actorOf(db);
        const normalized = normalizeBdPhone(phone);
        const found = db.parties.find((party) => party.tenantId === actor.tenantId && party.partyType === "Customer" && party.phoneE164 === normalized && !party.isDeleted);
        return { duplicate: Boolean(found), customerId: found?.id };
      });
    },
    async groups() {
      return withDb((db) => {
        const actor = actorOf(db);
        return db.groups.filter((group) => group.tenantId === actor.tenantId);
      });
    },
    async ledger(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        partyById(db, id, actor.tenantId);
        return db.entries
          .filter((entry) => entry.partyId === id)
          .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.sequenceNo - a.sequenceNo)
          .map((entry) => mapEntry(db, entry));
      });
    },
    async aging(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const party = partyById(db, id, actor.tenantId);
        return agingReport(db, [party], actor.today);
      });
    },
    async messages(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        partyById(db, id, actor.tenantId);
        return db.messages.filter((message) => message.partyId === id).map((message) => mapMessage(db, message));
      });
    },
    async timeline(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const party = partyById(db, id, actor.tenantId);
        const events = [
          ...db.entries.filter((entry) => entry.partyId === id).map((entry) => ({
            id: entry.id,
            at: entry.createdAtUtc,
            kind: "entry" as const,
            title: entry.documentNo,
            detail: entry.note,
          })),
          ...db.messages.filter((message) => message.partyId === id).map((message) => ({
            id: message.id,
            at: message.createdAtUtc,
            kind: "message" as const,
            title: message.channel,
            detail: message.status,
          })),
          ...db.promises.filter((promise) => promise.partyId === id).map((promise) => ({
            id: promise.id,
            at: promise.createdAtUtc,
            kind: "promise" as const,
            title: promise.status,
            detail: promise.note,
          })),
          ...db.contacts.filter((contact) => contact.partyId === id).map((contact) => ({
            id: contact.id,
            at: contact.atUtc,
            kind: "contact" as const,
            title: contact.outcome,
            detail: contact.note,
          })),
          ...db.statementViews.filter((view) => view.token === party.statementToken).map((view) => ({
            id: view.id,
            at: view.atUtc,
            kind: "statement" as const,
            title: "viewed",
            detail: view.atUtc,
          })),
        ];
        return events.sort((a, b) => b.at.localeCompare(a.at));
      });
    },
    async setConsent(id, channel, status) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        const party = partyById(db, id, actor.tenantId);
        const before = channel === "Sms" ? party.smsConsent : party.whatsAppConsent;
        if (channel === "Sms") party.smsConsent = status;
        else party.whatsAppConsent = status;
        audit(db, actor, "consent.update", "Party", id, { [channel]: before }, { [channel]: status });
        return mapCustomer(db, party, actor.today);
      });
    },
    async assignCollector(id, collectorId) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "staff.manage");
        const party = partyById(db, id, actor.tenantId);
        party.assignedCollectorId = collectorId ?? undefined;
        party.rowVersion += 1;
        return mapCustomer(db, party, actor.today);
      });
    },
    async createStatementLink(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        if (!can(actor.role, "messages.send")) throw new ApiError(403, "FORBIDDEN");
        const party = partyById(db, id, actor.tenantId);
        ensureStatement(party, actor.today);
        return { token: party.statementToken!, path: `/s/${party.statementToken}`, expiresOn: party.statementExpiresOn! };
      });
    },
  },
  suppliers: {
    async list(query) {
      return withDb((db) => queryParties(db, actorOf(db), "Supplier", query));
    },
    async get(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const party = partyById(db, id, actor.tenantId);
        if (party.partyType !== "Supplier") throw new ApiError(404, "NOT_FOUND");
        return mapCustomer(db, party, actor.today);
      });
    },
    async create(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        assertWritable(db, actor);
        const phone = body.phone ? normalizeBdPhone(body.phone) : `+8801${String(Date.now()).slice(-9)}`;
        const count = db.parties.filter((party) => party.tenantId === actor.tenantId && party.partyType === "Supplier").length + 1;
        const party: DbParty = {
          id: uid(),
          tenantId: actor.tenantId,
          partyType: "Supplier",
          code: `S-${String(count).padStart(3, "0")}`,
          name: body.name.trim(),
          nameEn: body.nameEn,
          phoneE164: phone,
          area: body.area?.trim() || "",
          address: body.address,
          creditLimitPaisa: 0,
          creditDays: body.creditDays ?? 0,
          preferredLanguage: "bn",
          preferredChannel: "None",
          notes: body.notes,
          currentBalancePaisa: 0,
          doNotRemind: true,
          smsConsent: "Unknown",
          whatsAppConsent: "Unknown",
          isArchived: false,
          isDeleted: false,
          rowVersion: 1,
          createdAtUtc: new Date().toISOString(),
        };
        if (!party.name) throw validation({ name: ["REQUIRED"] });
        db.parties.push(party);
        if (body.openingBalance && parseMoneyToPaisa(body.openingBalance) > 0) {
          postEntry(db, actor, { partyId: party.id, entryType: "OpeningBalance", amount: body.openingBalance, entryDate: actor.today, dueDate: body.openingDueDate, note: "প্রারম্ভিক দেনা" });
        }
        return mapCustomer(db, party, actor.today);
      });
    },
    async update(id, body, rowVersion) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        const party = partyById(db, id, actor.tenantId);
        if (String(party.rowVersion) !== rowVersion) throw new ApiError(409, "CONCURRENCY_CONFLICT");
        party.name = body.name.trim();
        party.area = body.area?.trim() || party.area;
        party.address = body.address;
        party.notes = body.notes;
        if (body.phone) party.phoneE164 = normalizeBdPhone(body.phone);
        party.rowVersion += 1;
        return mapCustomer(db, party, actor.today);
      });
    },
    async remove(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.delete");
        const party = partyById(db, id, actor.tenantId);
        if (party.currentBalancePaisa !== 0) throw businessError("BR-4.6");
        party.isDeleted = true;
      });
    },
    async ledger(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        partyById(db, id, actor.tenantId);
        return db.entries.filter((entry) => entry.partyId === id).sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.sequenceNo - a.sequenceNo).map((entry) => mapEntry(db, entry));
      });
    },
  },
  ledger: {
    async creditSale(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        const tenant = tenantOf(db, actor.tenantId);
        if (actor.role === "Collector" && !tenant.settings.collectorCanRecordCredit) throw new ApiError(403, "FORBIDDEN");
        if (actor.role !== "Collector") requirePerm(actor, "ledger.creditSale");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify(body), () => {
          const result = postEntry(db, actor, { partyId: body.customerId, entryType: "CreditSale", amount: body.amount, entryDate: body.entryDate, dueDate: body.dueDate, note: body.note, referenceNo: body.referenceNo, idempotencyKey: key });
          const mapped = writeResult(db, result);
          if (body.notify !== false) {
            const party = partyById(db, body.customerId, actor.tenantId);
            ensureStatement(party, actor.today);
            const template = db.templates.find((item) => item.key === "CreditSaleNotice" && item.language === party.preferredLanguage && item.channel === (party.preferredChannel === "Sms" ? "Sms" : "WhatsApp"));
            if (template && tenant.settings.notifyOnEntry) {
              const text = renderFor(db, template, party, { amount: localizedAmount(result.entry.amountPaisa, party.preferredLanguage), due_date: localizedDate(result.entry.dueDate ?? body.entryDate, party.preferredLanguage) });
              const message = dispatchMessage(db, actor, party, template.channel, text, "Transaction", template.id);
              mapped.notification = { messageId: message.id, channel: message.channel, status: message.status };
            }
          }
          audit(db, actor, "ledger.creditSale", "LedgerEntry", result.entry.id, undefined, { amount: body.amount, documentNo: result.entry.documentNo });
          return mapped;
        });
      });
    },
    async creditPurchase(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "ledger.creditSale");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify(body), () => writeResult(db, postEntry(db, actor, { partyId: body.supplierId, entryType: "CreditPurchase", amount: body.amount, entryDate: body.entryDate, dueDate: body.dueDate, note: body.note, referenceNo: body.referenceNo, idempotencyKey: key })));
      });
    },
    async adjustment(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "ledger.adjustment");
        assertWritable(db, actor);
        if (!body.reason.trim()) throw validation({ reason: ["REASON_REQUIRED"] });
        return remember(db, actor, key, JSON.stringify(body), () => writeResult(db, postEntry(db, actor, { partyId: body.partyId, entryType: body.type, amount: body.amount, entryDate: body.entryDate, note: body.reason, idempotencyKey: key })));
      });
    },
    async list(query) {
      return withDb((db) => {
        const actor = actorOf(db);
        let rows = db.entries.filter((entry) => entry.tenantId === actor.tenantId);
        if (query?.from) rows = rows.filter((entry) => entry.entryDate >= query.from!);
        if (query?.to) rows = rows.filter((entry) => entry.entryDate <= query.to!);
        if (query?.type) rows = rows.filter((entry) => entry.entryType === query.type);
        rows.sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.sequenceNo - a.sequenceNo);
        const page = query?.page ?? 1;
        const pageSize = query?.pageSize ?? 20;
        const start = (page - 1) * pageSize;
        return { items: rows.slice(start, start + pageSize).map((entry) => mapEntry(db, entry)), page, pageSize, totalCount: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / pageSize)) };
      });
    },
    async get(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const entry = db.entries.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!entry) throw new ApiError(404, "NOT_FOUND");
        return mapEntry(db, entry);
      });
    },
    async patchNote(id, note) {
      return withDb((db) => {
        const actor = actorOf(db);
        const entry = db.entries.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!entry) throw new ApiError(404, "NOT_FOUND");
        const before = entry.note ?? "";
        entry.note = note;
        audit(db, actor, "ledger.note", "LedgerEntry", id, { note: before }, { note });
        return mapEntry(db, entry);
      });
    },
    async reverse(id, body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        if (!can(actor.role, "ledger.reverse") && !can(actor.role, "ledger.reverseOwn")) throw new ApiError(403, "FORBIDDEN");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify({ id, ...body }), () => {
          const result = reverseEntry(db, actor, id, body.reason);
          audit(db, actor, "ledger.reverse", "LedgerEntry", id, undefined, { reason: body.reason, reversal: result.entry.documentNo });
          return writeResult(db, result);
        });
      });
    },
    async correct(id, body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        if (!can(actor.role, "ledger.reverse") && !can(actor.role, "ledger.reverseOwn")) throw new ApiError(403, "FORBIDDEN");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify({ id, ...body }), () => {
          const original = db.entries.find((item) => item.id === id && item.tenantId === actor.tenantId);
          if (!original) throw new ApiError(404, "NOT_FOUND");
          const { replacement } = correctEntry(db, actor, id, body.reason, { amount: body.amount, entryDate: body.entryDate, note: body.note, method: body.method, dueDate: body.dueDate });
          return writeResult(db, replacement);
        });
      });
    },
  },
  payments: {
    async receive(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "ledger.payment");
        assertWritable(db, actor);
        const tenant = tenantOf(db, actor.tenantId);
        if (actor.role === "Collector" && tenant.settings.requireCollectionApproval) throw businessError("BR-6.2");
        return remember(db, actor, key, JSON.stringify(body), () => {
          const result = postEntry(db, actor, {
            partyId: body.customerId,
            entryType: "PaymentReceived",
            amount: body.amount,
            entryDate: body.entryDate,
            method: body.method,
            referenceNo: body.referenceNo,
            note: body.note,
            manualAllocations: body.allocations,
            idempotencyKey: key,
          });
          const mapped = writeResult(db, result);
          if (body.notify !== false && tenant.settings.notifyOnEntry) {
            const party = partyById(db, body.customerId, actor.tenantId);
            const template = db.templates.find((item) => item.key === "Receipt" && item.language === party.preferredLanguage && item.channel === (party.preferredChannel === "Sms" ? "Sms" : "WhatsApp"));
            if (template) {
              const text = renderFor(db, template, party, { amount: localizedAmount(result.entry.amountPaisa, party.preferredLanguage), receipt_no: result.entry.documentNo });
              const message = dispatchMessage(db, actor, party, template.channel, text, "Transaction", template.id);
              mapped.notification = { messageId: message.id, channel: message.channel, status: message.status };
            }
          }
          audit(db, actor, "ledger.payment", "LedgerEntry", result.entry.id, undefined, { amount: body.amount, documentNo: result.entry.documentNo });
          return mapped;
        });
      });
    },
    async make(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "ledger.paymentMade");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify(body), () => writeResult(db, postEntry(db, actor, { partyId: body.supplierId, entryType: "PaymentMade", amount: body.amount, entryDate: body.entryDate, method: body.method, referenceNo: body.referenceNo, note: body.note, idempotencyKey: key })));
      });
    },
    async allocationPreview(customerId, amount) {
      return withDb((db) => {
        const actor = actorOf(db);
        const rows = allocationPreview(db, actor.tenantId, customerId, amount);
        return toAllocationResults(db, rows);
      });
    },
  },
  collections: {
    async today() {
      return withDb((db) => collectList(db, actorOf(db), "today"));
    },
    async overdue(bucket) {
      return withDb((db) => collectList(db, actorOf(db), "overdue", bucket));
    },
    async promises(status) {
      return withDb((db) => {
        const actor = actorOf(db);
        const visible = new Set(scopedParties(db, actor, "Customer").map((party) => party.id));
        for (const id of visible) evaluatePromises(db, id, actor.today);
        return db.promises.filter((promise) => promise.tenantId === actor.tenantId && visible.has(promise.partyId) && (!status || promise.status === status)).map((promise) => mapPromise(db, promise));
      });
    },
    async createPromise(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        if (!can(actor.role, "messages.send") && !can(actor.role, "ledger.payment")) throw new ApiError(403, "FORBIDDEN");
        assertWritable(db, actor);
        const party = partyById(db, body.customerId, actor.tenantId);
        if (!isIsoDate(body.promiseDate) || body.promiseDate < actor.today) throw validation({ promiseDate: ["DATE_INVALID"] });
        const amount = parseMoneyToPaisa(body.amount);
        if (amount <= 0) throw validation({ amount: ["AMOUNT_INVALID"] });
        for (const existing of db.promises.filter((item) => item.partyId === party.id && item.status === "Open")) {
          existing.status = "Cancelled";
          existing.cancelReason = "Superseded";
        }
        const promise = {
          id: uid(),
          tenantId: actor.tenantId,
          partyId: party.id,
          amountPaisa: amount,
          amountPaidPaisa: 0,
          promiseDate: body.promiseDate,
          status: "Open" as const,
          note: body.note,
          channel: body.channel ?? ("call" as const),
          createdBy: actor.userId,
          createdOn: actor.today,
          createdAtUtc: new Date().toISOString(),
        };
        db.promises.unshift(promise);
        return mapPromise(db, promise);
      });
    },
    async updatePromise(id, body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        const promise = db.promises.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!promise) throw new ApiError(404, "NOT_FOUND");
        if (promise.status !== "Open") throw businessError("BR-7.1");
        if (body.amount) promise.amountPaisa = parseMoneyToPaisa(body.amount);
        if (body.promiseDate) {
          if (body.promiseDate < actor.today) throw validation({ promiseDate: ["DATE_INVALID"] });
          promise.promiseDate = body.promiseDate;
        }
        if (body.note !== undefined) promise.note = body.note;
        return mapPromise(db, promise);
      });
    },
    async cancelPromise(id, reason) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        const promise = db.promises.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!promise) throw new ApiError(404, "NOT_FOUND");
        if (!reason.trim()) throw validation({ reason: ["REASON_REQUIRED"] });
        promise.status = "Cancelled";
        promise.cancelReason = reason;
        return mapPromise(db, promise);
      });
    },
    async logContact(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        partyById(db, body.customerId, actor.tenantId);
        const row = { id: uid(), tenantId: actor.tenantId, partyId: body.customerId, userId: actor.userId, channel: body.channel, outcome: body.outcome, note: body.note, atUtc: new Date().toISOString() };
        db.contacts.unshift(row);
        const user = db.users.find((item) => item.id === actor.userId)!;
        return { ...body, id: row.id, atUtc: row.atUtc, userName: user.fullName };
      });
    },
    async pending() {
      return withDb((db) => {
        const actor = actorOf(db);
        return db.pending
          .filter((item) => item.tenantId === actor.tenantId && (actor.role === "Collector" ? item.collectorId === actor.userId : true))
          .map((item) => ({
            id: item.id,
            customerId: item.partyId,
            customerName: db.parties.find((party) => party.id === item.partyId)?.name ?? "",
            collectorId: item.collectorId,
            collectorName: db.users.find((user) => user.id === item.collectorId)?.fullName ?? "",
            amount: money(item.amountPaisa),
            method: item.method,
            referenceNo: item.referenceNo,
            note: item.note,
            status: item.status,
            collectedAtUtc: item.collectedAtUtc,
            rejectReason: item.rejectReason,
          }));
      });
    },
    async submitPending(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        if (actor.role !== "Collector" && !can(actor.role, "collections.approve")) throw new ApiError(403, "FORBIDDEN");
        const party = partyById(db, body.customerId, actor.tenantId);
        const row = {
          id: uid(),
          tenantId: actor.tenantId,
          partyId: party.id,
          collectorId: actor.userId,
          amountPaisa: parseMoneyToPaisa(body.amount),
          method: body.method,
          referenceNo: body.referenceNo,
          note: body.note,
          status: "Pending" as const,
          collectedAtUtc: new Date().toISOString(),
        };
        db.pending.unshift(row);
        return {
          id: row.id,
          customerId: party.id,
          customerName: party.name,
          collectorId: actor.userId,
          collectorName: db.users.find((user) => user.id === actor.userId)?.fullName ?? "",
          amount: body.amount,
          method: body.method,
          referenceNo: body.referenceNo,
          note: body.note,
          status: "Pending" as const,
          collectedAtUtc: row.collectedAtUtc,
        };
      });
    },
    async approvePending(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "collections.approve");
        const pending = db.pending.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!pending || pending.status !== "Pending") throw new ApiError(404, "NOT_FOUND");
        const result = postEntry(db, { ...actor, userId: pending.collectorId }, {
          partyId: pending.partyId,
          entryType: "PaymentReceived",
          amount: money(pending.amountPaisa),
          entryDate: actor.today,
          method: pending.method,
          referenceNo: pending.referenceNo,
          note: pending.note ?? "কালেক্টর আদায়",
        });
        pending.status = "Approved";
        pending.postedEntryId = result.entry.id;
        audit(db, actor, "collection.approve", "PendingCollection", id, undefined, { documentNo: result.entry.documentNo });
        return writeResult(db, result);
      });
    },
    async rejectPending(id, reason) {
      return withDb(async (db) => {
        const actor = actorOf(db);
        requirePerm(actor, "collections.approve");
        if (!reason.trim()) throw validation({ reason: ["REASON_REQUIRED"] });
        const pending = db.pending.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!pending) throw new ApiError(404, "NOT_FOUND");
        pending.status = "Rejected";
        pending.rejectReason = reason;
        return (await mockApi.collections.pending()).find((item) => item.id === id)!;
      });
    },
    async handovers() {
      return withDb((db) => {
        const actor = actorOf(db);
        return db.handovers
          .filter((item) => item.tenantId === actor.tenantId && (actor.role === "Collector" ? item.collectorId === actor.userId : true))
          .map((item) => ({
            id: item.id,
            collectorId: item.collectorId,
            collectorName: db.users.find((user) => user.id === item.collectorId)?.fullName ?? "",
            handoverDate: item.handoverDate,
            declaredAmount: money(item.declaredPaisa),
            confirmedAmount: item.confirmedPaisa !== undefined ? money(item.confirmedPaisa) : undefined,
            cashCollected: money(item.cashCollectedPaisa),
            variance: item.confirmedPaisa !== undefined ? money(item.confirmedPaisa - item.cashCollectedPaisa) : undefined,
            status: item.status,
            note: item.note,
          }));
      });
    },
    async submitHandover(body) {
      return withDb(async (db) => {
        const actor = actorOf(db);
        const declared = parseMoneyToPaisa(body.declaredAmount);
        const cash = db.entries
          .filter((entry) => entry.tenantId === actor.tenantId && entry.entryType === "PaymentReceived" && entry.paymentMethod === "Cash" && entry.entryDate === body.date && entry.createdBy === actor.userId && !entry.isReversed)
          .reduce((sum, entry) => sum + entry.amountPaisa, 0);
        const row = { id: uid(), tenantId: actor.tenantId, collectorId: actor.userId, handoverDate: body.date, declaredPaisa: declared, cashCollectedPaisa: cash, status: "Submitted" as const, note: body.note };
        db.handovers.unshift(row);
        return (await mockApi.collections.handovers()).find((item) => item.id === row.id)!;
      });
    },
    async confirmHandover(id, body) {
      return withDb(async (db) => {
        const actor = actorOf(db);
        requirePerm(actor, "collections.approve");
        const row = db.handovers.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!row) throw new ApiError(404, "NOT_FOUND");
        const confirmed = parseMoneyToPaisa(body.confirmedAmount);
        if (confirmed !== row.cashCollectedPaisa && !body.note?.trim()) throw validation({ note: ["VARIANCE_NOTE_REQUIRED"] });
        row.confirmedPaisa = confirmed;
        row.note = body.note ?? row.note;
        row.status = "Confirmed";
        return (await mockApi.collections.handovers()).find((item) => item.id === id)!;
      });
    },
  },
  reminders: {
    async templates(filter) {
      return withDb((db) => {
        actorOf(db);
        return db.templates
          .filter((template) => (!filter?.channel || template.channel === filter.channel) && (!filter?.language || template.language === filter.language))
          .map((template) => ({
            id: template.id,
            key: template.key,
            channel: template.channel,
            language: template.language,
            name: template.name,
            description: template.description,
            body: template.body,
            whatsAppStatus: template.whatsAppStatus,
            isActive: true,
          }));
      });
    },
    async updateTemplate(id, body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "reminders.manage");
        const template = db.templates.find((item) => item.id === id);
        if (!template) throw new ApiError(404, "NOT_FOUND");
        renderTemplate(body, {});
        const copy = { ...template, id: uid(), tenantId: actor.tenantId, body };
        db.templates.unshift(copy);
        return { id: copy.id, key: copy.key, channel: copy.channel, language: copy.language, name: copy.name, description: copy.description, body: copy.body, whatsAppStatus: copy.whatsAppStatus, isActive: true };
      });
    },
    async preview(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        const template = body.templateId ? db.templates.find((item) => item.id === body.templateId) : undefined;
        const party = body.partyId ? partyById(db, body.partyId, actor.tenantId) : scopedParties(db, actor, "Customer").find((item) => item.currentBalancePaisa > 0) ?? scopedParties(db, actor, "Customer")[0];
        if (!party) throw new ApiError(404, "NOT_FOUND");
        const text = template ? renderFor(db, template, party) : renderTemplate(body.text ?? "", templateVars(db, party));
        const info = smsSegments(text);
        const cost = messageCostPaisa(body.channel, text);
        return { text, segments: body.channel === "WhatsApp" ? 1 : info.segments, encoding: info.encoding, cost: money(cost), length: info.length };
      });
    },
    async send(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "messages.send");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify(body), () => {
          const party = partyById(db, body.partyId, actor.tenantId);
          if (actor.role === "Collector" && party.assignedCollectorId !== actor.userId) throw new ApiError(404, "NOT_FOUND");
          const template = body.templateId ? db.templates.find((item) => item.id === body.templateId) : undefined;
          const text = template ? renderFor(db, template, party) : body.body ?? "";
          if (!text.trim()) throw validation({ body: ["REQUIRED"] });
          return dispatchMessage(db, actor, party, body.channel, text, "Manual", template?.id);
        });
      });
    },
    async bulkPreview(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "messages.bulk");
        const template = db.templates.find((item) => item.id === body.templateId);
        if (!template) throw new ApiError(404, "NOT_FOUND");
        const parties = body.customerIds.map((id) => partyById(db, id, actor.tenantId));
        const samples = parties.slice(0, 3).map((party) => ({ name: party.name, text: renderFor(db, template, party) }));
        const cost = parties.reduce((sum, party) => sum + messageCostPaisa(body.channel, renderFor(db, template, party)), 0);
        return { recipientCount: parties.length, estimatedCost: money(cost), samples };
      });
    },
    async bulkSend(body, key) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "messages.bulk");
        assertWritable(db, actor);
        return remember(db, actor, key, JSON.stringify(body), () => {
          const template = db.templates.find((item) => item.id === body.templateId);
          if (!template) throw new ApiError(404, "NOT_FOUND");
          const batchId = uid();
          let sent = 0;
          for (const id of body.customerIds) {
            const party = partyById(db, id, actor.tenantId);
            const message = dispatchMessage(db, actor, party, body.channel, renderFor(db, template, party), "Bulk", template.id);
            if (message.status === "Sent") sent += 1;
            const stored = db.messages.find((item) => item.id === message.id);
            if (stored) stored.batchId = batchId;
          }
          return { batchId, sent };
        });
      });
    },
    async messages(query) {
      return withDb((db) => {
        const actor = actorOf(db);
        return db.messages.filter((message) => message.tenantId === actor.tenantId && (!query?.status || message.status === query.status)).map((message) => mapMessage(db, message));
      });
    },
    async retry(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "reminders.manage");
        const message = db.messages.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!message) throw new ApiError(404, "NOT_FOUND");
        if (message.status !== "Failed") throw businessError("BR-8.13");
        const party = partyById(db, message.partyId!, actor.tenantId);
        return dispatchMessage(db, actor, party, message.channel, message.renderedBody, message.triggerType);
      });
    },
    async rules() {
      return withDb((db) => {
        const actor = actorOf(db);
        return db.rules.filter((rule) => rule.tenantId === actor.tenantId);
      });
    },
    async updateRule(id, patch) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "reminders.manage");
        const rule = db.rules.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!rule) throw new ApiError(404, "NOT_FOUND");
        if (patch.offsetDays !== undefined && (patch.offsetDays < -30 || patch.offsetDays > 365)) throw validation({ offsetDays: ["OFFSET_RANGE"] });
        if (patch.isEnabled !== undefined) rule.isEnabled = patch.isEnabled;
        if (patch.offsetDays !== undefined) rule.offsetDays = patch.offsetDays;
        if (patch.channel) rule.channel = patch.channel;
        if (patch.templateKey) rule.templateKey = patch.templateKey;
        return rule;
      });
    },
    async simulate(date) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "reminders.manage");
        const tenant = tenantOf(db, actor.tenantId);
        const rules = db.rules.filter((rule) => rule.tenantId === actor.tenantId && rule.isEnabled);
        const hits: { customerId: string; name: string; ruleCode: string; templateKey: string }[] = [];
        for (const party of scopedParties(db, actor, "Customer")) {
          if (party.doNotRemind || party.isArchived || party.currentBalancePaisa <= tenant.settings.minReminderBalancePaisa) continue;
          if (party.smsConsent === "OptedOut" && party.whatsAppConsent === "OptedOut") continue;
          const openPtp = db.promises.some((promise) => promise.partyId === party.id && promise.status === "Open");
          for (const rule of rules) {
            if (rule.triggerType !== "Ptp" && openPtp) continue;
            const dues = openDues(db, party.id);
            let match = false;
            if (rule.triggerType === "OnDue") match = dues.some((due) => due.dueDate === date);
            if (rule.triggerType === "BeforeDue") match = dues.some((due) => addDays(due.dueDate, rule.offsetDays) === date);
            if (rule.triggerType === "AfterDue" || rule.triggerType === "Escalation") {
              match = dues.some((due) => {
                const dpd = diffDays(date, due.dueDate);
                if (dpd < rule.offsetDays) return false;
                const every = rule.repeatEveryDays ?? 1;
                return (dpd - rule.offsetDays) % every === 0;
              });
            }
            if (rule.triggerType === "Ptp") match = db.promises.some((promise) => promise.partyId === party.id && promise.status === "Open" && promise.promiseDate === date);
            if (rule.triggerType === "MonthlyStatement") match = date.endsWith("-01") && party.currentBalancePaisa > 0;
            if (match) {
              hits.push({ customerId: party.id, name: party.name, ruleCode: rule.code, templateKey: rule.templateKey });
              break;
            }
          }
        }
        return hits;
      });
    },
    async wallet() {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "wallet.view");
        const wallet = db.wallets.find((item) => item.tenantId === actor.tenantId)!;
        return { balance: money(wallet.balancePaisa), reserved: money(wallet.reservedPaisa), threshold: money(wallet.thresholdPaisa), low: wallet.balancePaisa < wallet.thresholdPaisa };
      });
    },
    async walletTransactions() {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "wallet.manage");
        return db.walletTx.filter((item) => item.tenantId === actor.tenantId).map((item) => ({ id: item.id, type: item.type, amount: money(item.amountPaisa), balanceAfter: money(item.balanceAfterPaisa), note: item.note, createdAtUtc: item.createdAtUtc }));
      });
    },
    async setThreshold(amount) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "wallet.manage");
        const wallet = db.wallets.find((item) => item.tenantId === actor.tenantId)!;
        wallet.thresholdPaisa = parseMoneyToPaisa(amount);
        return { balance: money(wallet.balancePaisa), reserved: money(wallet.reservedPaisa), threshold: money(wallet.thresholdPaisa), low: wallet.balancePaisa < wallet.thresholdPaisa };
      });
    },
  },
  reports: {
    async summary() {
      return withDb((db) => buildSummary(db, actorOf(db)));
    },
    async aging() {
      return withDb((db) => {
        const actor = actorOf(db);
        return agingReport(db, scopedParties(db, actor, "Customer"), actor.today);
      });
    },
    async trends() {
      return withDb((db) => {
        const actor = actorOf(db);
        const visible = new Set(scopedParties(db, actor, "Customer").map((party) => party.id));
        return lastNDays(actor.today, 7).map((date) => ({
          date,
          amount: money(
            db.entries
              .filter((entry) => entry.tenantId === actor.tenantId && visible.has(entry.partyId) && entry.entryType === "PaymentReceived" && entry.entryDate === date && !entry.isReversed)
              .reduce((sum, entry) => sum + entry.amountPaisa, 0),
          ),
        }));
      });
    },
    async dues() {
      return withDb((db) => {
        const actor = actorOf(db);
        return scopedParties(db, actor, "Customer").map((party) => {
          const customer = mapCustomer(db, party, actor.today);
          return { customerId: party.id, name: party.name, phoneE164: party.phoneE164, area: party.area, balance: customer.balance, overdue: customer.overdue, dpd: customer.dpd, nextDueDate: customer.nextDueDate };
        });
      });
    },
    async collections(query) {
      return withDb((db) => {
        const actor = actorOf(db);
        const from = query?.from ?? addDays(actor.today, -6);
        const to = query?.to ?? actor.today;
        const days = [];
        for (let date = from; date <= to; date = addDays(date, 1)) days.push(date);
        const visible = new Set(scopedParties(db, actor, "Customer").map((party) => party.id));
        return days.map((date) => {
          const rows = db.entries.filter((entry) => visible.has(entry.partyId) && entry.entryType === "PaymentReceived" && entry.entryDate === date && !entry.isReversed);
          return { date, count: rows.length, amount: money(rows.reduce((sum, entry) => sum + entry.amountPaisa, 0)) };
        });
      });
    },
    async collectors() {
      return withDb((db) => {
        const actor = actorOf(db);
        const members = db.memberships.filter((item) => item.tenantId === actor.tenantId && item.isActive);
        return members.map((membership) => {
          const user = db.users.find((item) => item.id === membership.userId)!;
          const rows = db.entries.filter((entry) => entry.tenantId === actor.tenantId && entry.entryType === "PaymentReceived" && entry.createdBy === user.id && !entry.isReversed);
          return { collectorId: user.id, name: user.fullName, role: membership.role, count: rows.length, amount: money(rows.reduce((sum, entry) => sum + entry.amountPaisa, 0)) };
        }).filter((row) => row.count > 0);
      });
    },
    async exportCsv(report) {
      return withDb(async (db) => {
        const actor = actorOf(db);
        requirePerm(actor, "data.export");
        if (report === "dues") {
          const rows = await mockApi.reports.dues();
          return ["নাম,ফোন,এলাকা,বাকি,মেয়াদোত্তীর্ণ", ...rows.map((row) => `${row.name},${row.phoneE164},${row.area},${row.balance},${row.overdue}`)].join("\n");
        }
        if (report === "collections") {
          const rows = await mockApi.reports.collections();
          return ["তারিখ,সংখ্যা,আদায়", ...rows.map((row) => `${row.date},${row.count},${row.amount}`)].join("\n");
        }
        const aging = await mockApi.reports.aging();
        return ["বাকেট,টাকা,কাস্টমার", ...aging.buckets.map((bucket) => `${bucket.key},${bucket.amount},${bucket.customers}`)].join("\n");
      });
    },
  },
  settings: {
    async tenant() {
      return withDb((db) => profile(db, actorOf(db)));
    },
    async updateTenant(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "settings.manage");
        const tenant = tenantOf(db, actor.tenantId);
        if (body.name) tenant.name = body.name;
        if (body.nameBn) tenant.nameBn = body.nameBn;
        if (body.businessType) tenant.businessType = body.businessType;
        if (body.phone) tenant.phoneE164 = normalizeBdPhone(body.phone);
        if (body.address !== undefined) tenant.address = body.address;
        if (body.email !== undefined) tenant.email = body.email;
        tenant.logoText = tenant.nameBn.slice(0, 1);
        audit(db, actor, "tenant.update", "Tenant", tenant.id, undefined, { nameBn: tenant.nameBn });
        return profile(db, actor);
      });
    },
    async updateSettings(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "settings.manage");
        const tenant = tenantOf(db, actor.tenantId);
        if (body.sendWindowStart && body.sendWindowEnd && body.sendWindowEnd <= body.sendWindowStart) {
          throw validation({ sendWindowEnd: ["WINDOW_ORDER"] });
        }
        tenant.settings = { ...tenant.settings, ...mapSettingsPatch(body) };
        return profile(db, actor);
      });
    },
    async periodLock(date) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "period.lock");
        if (!isIsoDate(date)) throw validation({ date: ["DATE_INVALID"] });
        tenantOf(db, actor.tenantId).settings.lockedUntilDate = date;
        return profile(db, actorOf(db));
      });
    },
    async checklist() {
      return withDb((db) => {
        const actor = actorOf(db);
        const customers = db.parties.filter((party) => party.tenantId === actor.tenantId && party.partyType === "Customer" && !party.isDeleted);
        return {
          customersAdded: customers.length > 0,
          openingBalances: db.entries.some((entry) => entry.tenantId === actor.tenantId && entry.entryType === "OpeningBalance"),
          reminderRulesReviewed: db.rules.some((rule) => rule.tenantId === actor.tenantId),
          testMessageSent: db.messages.some((message) => message.tenantId === actor.tenantId),
          staffInvited: db.memberships.filter((item) => item.tenantId === actor.tenantId).length > 1,
        };
      });
    },
    async subscription() {
      return withDb((db) => subscriptionOf(db, actorOf(db)));
    },
    async recordManualPayment() {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "subscription.view");
        const tenant = tenantOf(db, actor.tenantId);
        tenant.status = "Active";
        tenant.trialEndsOn = undefined;
        audit(db, actor, "subscription.paid", "Tenant", tenant.id, undefined, { status: "Active" });
        return subscriptionOf(db, actor);
      });
    },
    async resetDemo() {
      return withDb(() => {
        resetDb();
        setAccessToken(null);
      });
    },
    async importPreview(csv) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        const parsed = parseImport(csv);
        const job = { id: uid(), tenantId: actor.tenantId, csv, errors: parsed.errors, validRows: parsed.valid, committed: false };
        db.imports.unshift(job);
        return { id: job.id, totalRows: parsed.total, validRows: parsed.valid.length, errors: parsed.errors, committed: false };
      });
    },
    async importCommit(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "customers.write");
        const job = db.imports.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!job || job.committed) throw new ApiError(404, "NOT_FOUND");
        let created = 0;
        for (const row of job.validRows) {
          const type = row.Type?.toLowerCase() === "supplier" ? "Supplier" : "Customer";
          const phone = normalizeBdPhone(row.Phone);
          const exists = db.parties.some((party) => party.tenantId === actor.tenantId && party.phoneE164 === phone && !party.isDeleted);
          if (exists) continue;
          const count = db.parties.filter((party) => party.tenantId === actor.tenantId && party.partyType === type).length + 1;
          const party: DbParty = {
            id: uid(),
            tenantId: actor.tenantId,
            partyType: type,
            code: `${type === "Customer" ? "C" : "S"}-${String(count).padStart(3, "0")}`,
            name: row.Name!,
            phoneE164: phone,
            area: row.Area ?? "",
            notes: row.Notes,
            creditLimitPaisa: row.CreditLimit ? parseMoneyToPaisa(row.CreditLimit) : 0,
            creditDays: row.CreditDays ? Number(row.CreditDays) : 7,
            preferredLanguage: row.Language === "en" ? "en" : "bn",
            preferredChannel: type === "Customer" ? "WhatsApp" : "None",
            currentBalancePaisa: 0,
            doNotRemind: type === "Supplier",
            smsConsent: "OptedIn",
            whatsAppConsent: "OptedIn",
            isArchived: false,
            isDeleted: false,
            rowVersion: 1,
            createdAtUtc: new Date().toISOString(),
          };
          db.parties.push(party);
          if (row.OpeningBalance && parseMoneyToPaisa(row.OpeningBalance) > 0) {
            postEntry(db, { ...actor, skipPolicy: true }, { partyId: party.id, entryType: "OpeningBalance", amount: normalizeMoney(row.OpeningBalance), entryDate: actor.today, dueDate: row.OpeningDueDate, note: "ইমপোর্ট" });
          }
          created += 1;
        }
        job.committed = true;
        return { created };
      });
    },
    async importErrorReport(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const job = db.imports.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!job) throw new ApiError(404, "NOT_FOUND");
        return ["row,field,code", ...job.errors.map((error) => `${error.row},${error.field},${error.code}`)].join("\n");
      });
    },
  },
  staff: {
    async list() {
      return withDb((db) => {
        const actor = actorOf(db);
        return db.memberships.filter((item) => item.tenantId === actor.tenantId).map((item) => mapMember(db, item.id));
      });
    },
    async invite(body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "staff.manage");
        if (body.role === "Owner" && !can(actor.role, "staff.assignOwner")) throw new ApiError(403, "FORBIDDEN");
        const phone = normalizeBdPhone(body.phone);
        if (!body.fullName.trim()) throw validation({ fullName: ["REQUIRED"] });
        let user = db.users.find((item) => item.phoneE164 === phone);
        if (!user) {
          user = { id: uid(), phoneE164: phone, fullName: body.fullName.trim(), password: DEMO_PASSWORD_VALUE, preferredLanguage: "bn", status: "Active" };
          db.users.push(user);
        }
        const existing = db.memberships.find((item) => item.tenantId === actor.tenantId && item.userId === user!.id);
        if (existing) throw new ApiError(409, "CONFLICT");
        const membership = { id: uid(), tenantId: actor.tenantId, userId: user.id, role: body.role, isActive: true, subtitle: body.subtitle?.trim() || "" };
        db.memberships.push(membership);
        audit(db, actor, "staff.invite", "Membership", membership.id, undefined, { phone, role: body.role });
        return mapMember(db, membership.id);
      });
    },
    async update(id, body) {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "staff.manage");
        const membership = db.memberships.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!membership) throw new ApiError(404, "NOT_FOUND");
        if (body.role === "Owner" && !can(actor.role, "staff.assignOwner")) throw new ApiError(403, "FORBIDDEN");
        if (membership.role === "Owner" && body.role && body.role !== "Owner") {
          const owners = db.memberships.filter((item) => item.tenantId === actor.tenantId && item.role === "Owner" && item.isActive);
          if (owners.length <= 1) throw businessError("BR-1.3");
        }
        if (membership.role === "Owner" && body.isActive === false) {
          const owners = db.memberships.filter((item) => item.tenantId === actor.tenantId && item.role === "Owner" && item.isActive);
          if (owners.length <= 1) throw businessError("BR-1.3");
        }
        const before = { role: membership.role, isActive: String(membership.isActive) };
        if (body.role) membership.role = body.role;
        if (body.isActive !== undefined) membership.isActive = body.isActive;
        audit(db, actor, "staff.update", "Membership", id, before, { role: membership.role, isActive: String(membership.isActive) });
        return mapMember(db, id);
      });
    },
    async remove(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        if (actor.role !== "Owner") throw new ApiError(403, "FORBIDDEN");
        const membership = db.memberships.find((item) => item.id === id && item.tenantId === actor.tenantId);
        if (!membership) throw new ApiError(404, "NOT_FOUND");
        if (membership.role === "Owner") {
          const owners = db.memberships.filter((item) => item.tenantId === actor.tenantId && item.role === "Owner" && item.isActive);
          if (owners.length <= 1) throw businessError("BR-1.3");
        }
        db.memberships.splice(db.memberships.indexOf(membership), 1);
      });
    },
  },
  statements: {
    async publicGet(token) {
      return withDb((db) => {
        const party = db.parties.find((item) => item.statementToken === token && !item.isDeleted);
        if (!party) throw new ApiError(404, "NOT_FOUND");
        if (party.statementExpiresOn && party.statementExpiresOn < businessToday()) throw new ApiError(404, "NOT_FOUND");
        const tenant = tenantOf(db, party.tenantId);
        db.statementViews.unshift({ id: uid(), token, atUtc: new Date().toISOString() });
        const entries = db.entries
          .filter((entry) => entry.partyId === party.id)
          .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.sequenceNo - a.sequenceNo)
          .slice(0, 20);
        const phone = party.phoneE164;
        return {
          businessName: party.preferredLanguage === "bn" ? tenant.nameBn : tenant.name,
          businessPhone: tenant.phoneE164,
          logoText: tenant.logoText,
          address: tenant.address,
          customerName: party.preferredLanguage === "en" && party.nameEn ? party.nameEn : party.name,
          maskedPhone: `${phone.slice(0, 7)}•••${phone.slice(-3)}`,
          balance: money(party.currentBalancePaisa),
          overdue: money(overduePaisa(db, party.id, businessToday())),
          language: party.preferredLanguage,
          entries: entries.map((entry) => ({
            date: entry.entryDate,
            label: entry.note || entry.documentNo,
            amount: money(entry.amountPaisa),
            direction: entry.direction,
            balanceAfter: money(entry.balanceAfterPaisa),
          })),
        };
      });
    },
    async optOut(token) {
      return withDb((db) => {
        const party = db.parties.find((item) => item.statementToken === token);
        if (!party) throw new ApiError(404, "NOT_FOUND");
        party.smsConsent = "OptedOut";
        party.whatsAppConsent = "OptedOut";
      });
    },
  },
  notifications: {
    async list() {
      return withDb((db) => {
        const actor = actorOf(db);
        const language = db.users.find((user) => user.id === actor.userId)?.preferredLanguage ?? "bn";
        return db.notifications
          .filter((item) => item.tenantId === actor.tenantId && item.userId === actor.userId)
          .map((item) => ({
            id: item.id,
            type: item.type,
            title: language === "bn" ? item.titleBn : item.titleEn,
            body: language === "bn" ? item.bodyBn : item.bodyEn,
            href: item.href,
            entityType: item.entityType,
            entityId: item.entityId,
            readAtUtc: item.readAtUtc,
            createdAtUtc: item.createdAtUtc,
          }));
      });
    },
    async markRead(id) {
      return withDb((db) => {
        const actor = actorOf(db);
        const item = db.notifications.find((row) => row.id === id && row.userId === actor.userId);
        if (item) item.readAtUtc = new Date().toISOString();
      });
    },
    async markAllRead() {
      return withDb((db) => {
        const actor = actorOf(db);
        for (const item of db.notifications.filter((row) => row.userId === actor.userId && row.tenantId === actor.tenantId)) {
          item.readAtUtc = new Date().toISOString();
        }
      });
    },
  },
  audit: {
    async list() {
      return withDb((db) => {
        const actor = actorOf(db);
        requirePerm(actor, "audit.view");
        return db.audit.filter((item) => item.tenantId === actor.tenantId).map((item) => mapAudit(db, item));
      });
    },
  },
  admin: {
    tenants: () => withDb((db) => { platformActor(db); return listTenantSummaries(db); }),
    tenant: (id) => withDb((db) => { platformActor(db); return mapTenantDetail(db, id); }),
    createTenant: (body) => withDb((db) => { platformActor(db); return createTenantRecord(db, body); }),
    setStatus: (id, status) => withDb((db) => { platformActor(db); return setTenantStatus(db, id, status); }),
    setSubscription: (id, planId) => withDb((db) => { platformActor(db); return setTenantSubscription(db, id, planId); }),
    createInvoice: (tenantId, body) => withDb((db) => { platformActor(db); return createInvoiceRecord(db, tenantId, body); }),
    invoices: () => withDb((db) => { platformActor(db); return listInvoices(db); }),
    markInvoicePaid: (id) => withDb((db) => { platformActor(db); return markInvoicePaid(db, id); }),
    topUpWallet: (tenantId, amount) => withDb((db) => { platformActor(db); return topUpWallet(db, tenantId, amount); }),
    plans: () => withDb((db) => { platformActor(db); return listPlans(db); }),
    createPlan: (body) => withDb((db) => { platformActor(db); return createPlanRecord(db, body); }),
    updatePlan: (id, body) => withDb((db) => { platformActor(db); return updatePlanRecord(db, id, body); }),
    deletePlan: (id) => withDb((db) => { platformActor(db); deletePlanRecord(db, id); }),
    channelRates: () => withDb((db) => { platformActor(db); return listChannelRates(db); }),
    updateChannelRate: (id, price) => withDb((db) => { platformActor(db); return updateChannelRateRecord(db, id, price); }),
    holidays: () => withDb((db) => { platformActor(db); return listHolidays(db); }),
    createHoliday: (body) => withDb((db) => { platformActor(db); return createHolidayRecord(db, body); }),
    deleteHoliday: (id) => withDb((db) => { platformActor(db); deleteHolidayRecord(db, id); }),
  },
};

function profile(db: AppDatabase, actor: EngineActor) {
  const tenant = tenantOf(db, actor.tenantId);
  const settings = tenant.settings;
  return {
    id: tenant.id,
    name: tenant.name,
    nameBn: tenant.nameBn,
    businessType: tenant.businessType,
    phoneE164: tenant.phoneE164,
    email: tenant.email,
    address: tenant.address,
    logoText: tenant.logoText,
    timeZone: "Asia/Dhaka" as const,
    currencyCode: "BDT" as const,
    status: tenant.status,
    trialEndsOn: tenant.trialEndsOn,
    settings: {
      defaultCreditDays: settings.defaultCreditDays,
      backdateLimitDays: settings.backdateLimitDays,
      lockedUntilDate: settings.lockedUntilDate,
      sendWindowStart: settings.sendWindowStart,
      sendWindowEnd: settings.sendWindowEnd,
      sendDays: settings.sendDays,
      digestTime: settings.digestTime,
      requireCollectionApproval: settings.requireCollectionApproval,
      collectorCanSeeAll: settings.collectorCanSeeAll,
      collectorCanRecordCredit: settings.collectorCanRecordCredit,
      staffReverseWindowMinutes: settings.staffReverseWindowMinutes,
      minReminderBalance: money(settings.minReminderBalancePaisa),
      maxRemindersPerCustomerPerDay: settings.maxRemindersPerCustomerPerDay,
      fallbackToSms: settings.fallbackToSms,
      receiptsIgnoreOptOut: settings.receiptsIgnoreOptOut,
      enforceCreditLimit: settings.enforceCreditLimit,
      defaultLanguage: settings.defaultLanguage,
      skipFridayJummah: settings.skipFridayJummah,
      notifyOnEntry: settings.notifyOnEntry,
    },
  };
}

function mapSettingsPatch(body: Partial<ReturnType<typeof profile>["settings"]>) {
  const patch: Record<string, unknown> = { ...body };
  if (body.minReminderBalance) patch.minReminderBalancePaisa = parseMoneyToPaisa(body.minReminderBalance);
  delete patch.minReminderBalance;
  return patch;
}

function subscriptionOf(db: AppDatabase, actor: EngineActor) {
  const tenant = tenantOf(db, actor.tenantId);
  const daysLeft = tenant.trialEndsOn ? diffDays(tenant.trialEndsOn, actor.today) : undefined;
  const expiring = tenant.status === "Trial" || tenant.status === "PastDue";
  return {
    planName: tenant.planName,
    status: tenant.status,
    trialEndsOn: tenant.trialEndsOn,
    daysLeft,
    maxCustomers: tenant.maxCustomers,
    customerCount: activeCustomers(db, actor.tenantId),
    showExpiryBanner: Boolean(expiring && daysLeft !== undefined && daysLeft <= 7),
  };
}

function collectList(db: AppDatabase, actor: EngineActor, mode: "today" | "overdue", bucket?: "b0_30" | "b31_60" | "b61_90" | "b90") {
  const items = scopedParties(db, actor, "Customer")
    .map((party) => {
      const customer = mapCustomer(db, party, actor.today);
      const ptp = db.promises.find((promise) => promise.partyId === party.id && promise.status === "Open" && promise.promiseDate <= actor.today);
      let reason: "ptp" | "dueToday" | "overdue" | null = null;
      if (ptp) reason = "ptp";
      else if (customer.status === "dueToday") reason = "dueToday";
      else if (customer.status === "overdue") reason = "overdue";
      const dpd = customerDpd(db, party, actor.today) ?? 0;
      const uiBucket = dpd <= 30 ? "b0_30" : dpd <= 60 ? "b31_60" : dpd <= 90 ? "b61_90" : "b90";
      return {
        customerId: party.id,
        name: party.name,
        area: party.area,
        phoneE164: party.phoneE164,
        balance: customer.balance,
        overdue: customer.overdue,
        dpd: customer.dpd,
        reason: reason ?? "overdue",
        priority: reason === "ptp" ? 3 : reason === "dueToday" ? 2 : 1,
        promiseDate: ptp?.promiseDate,
        include: mode === "today" ? reason !== null : customer.status === "overdue" && (!bucket || uiBucket === bucket),
        score: (customer.dpd ?? 0) * Math.max(0, party.currentBalancePaisa),
      };
    })
    .filter((item) => item.include)
    .sort((a, b) => b.priority - a.priority || b.score - a.score);
  return items.map((item) => {
    const { include: listed, score: rank, ...rest } = item;
    return listed || rank >= 0 ? rest : rest;
  });
}

function parseImport(csv: string): { total: number; valid: Record<string, string>[]; errors: { row: number; field: string; code: string }[] } {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { total: 0, valid: [], errors: [] };
  const header = splitCsv(lines[0]!).map((cell) => cell.trim());
  const valid: Record<string, string>[] = [];
  const errors: { row: number; field: string; code: string }[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const cells = splitCsv(lines[index]!);
    const row: Record<string, string> = {};
    header.forEach((key, cellIndex) => {
      row[key] = cells[cellIndex]?.trim() ?? "";
    });
    const rowNumber = index + 1;
    if (!row.Name) errors.push({ row: rowNumber, field: "Name", code: "REQUIRED" });
    if (!row.Phone || !safePhone(row.Phone)) errors.push({ row: rowNumber, field: "Phone", code: "PHONE_INVALID" });
    if (row.OpeningBalance && !/^\d+(\.\d{1,2})?$/.test(row.OpeningBalance)) errors.push({ row: rowNumber, field: "OpeningBalance", code: "AMOUNT_INVALID" });
    if (!errors.some((error) => error.row === rowNumber)) valid.push(row);
  }
  return { total: lines.length - 1, valid, errors };
}

function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function safePhone(value: string): boolean {
  try {
    normalizeBdPhone(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeMoney(value: string): string {
  return value.includes(".") ? value : `${value}.00`;
}

function buildSummary(db: AppDatabase, actor: EngineActor) {
  const customers = scopedParties(db, actor, "Customer");
  const suppliers = actor.role === "Collector" ? [] : scopedParties(db, actor, "Supplier");
  const visible = new Set(customers.map((party) => party.id));
  const month = actor.today.slice(0, 7);
  const payments = db.entries.filter((entry) => entry.tenantId === actor.tenantId && visible.has(entry.partyId) && entry.entryType === "PaymentReceived" && !entry.isReversed);
  const wallet = db.wallets.find((item) => item.tenantId === actor.tenantId);
  const tenant = tenantOf(db, actor.tenantId);
  return {
    receivable: money(customers.reduce((sum, party) => sum + Math.max(0, party.currentBalancePaisa), 0)),
    payable: money(suppliers.reduce((sum, party) => sum + Math.max(0, -party.currentBalancePaisa), 0)),
    overdue: money(customers.reduce((sum, party) => sum + overduePaisa(db, party.id, actor.today), 0)),
    collectedToday: money(payments.filter((entry) => entry.entryDate === actor.today).reduce((sum, entry) => sum + entry.amountPaisa, 0)),
    collectedThisMonth: money(payments.filter((entry) => entry.entryDate.startsWith(month)).reduce((sum, entry) => sum + entry.amountPaisa, 0)),
    ptpDueToday: db.promises.filter((promise) => visible.has(promise.partyId) && promise.status === "Open" && promise.promiseDate === actor.today).length,
    walletBalance: money(wallet?.balancePaisa ?? 0),
    walletLow: (wallet?.balancePaisa ?? 0) < (wallet?.thresholdPaisa ?? 0),
    customerCount: customers.length,
    businessName: tenant.nameBn,
    businessDate: actor.today,
  };
}
