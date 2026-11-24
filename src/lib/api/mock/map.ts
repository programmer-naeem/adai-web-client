import { diffDays, formatDate } from "@/lib/date";
import { formatBDT, paisaToMoneyString } from "@/lib/money";
import { permissionsFor } from "@/lib/permissions";
import {
  customerDpd,
  dueRemaining,
  openDues,
  overduePaisa,
  type Database,
} from "@/lib/api/mock/engine";
import type { DbParty, DbPromise } from "@/lib/api/mock/engine";
import type { AppDatabase, DbAudit, DbMessage } from "@/lib/api/mock/seed";
import type {
  AgingBucket,
  Customer,
  LedgerEntry,
  Member,
  PartyAging,
  PromiseDto,
} from "@/lib/api/types";

export function money(paisa: number): string {
  return paisaToMoneyString(paisa);
}

export function mapCustomer(db: AppDatabase, party: DbParty, today: string): Customer {
  const dpd = customerDpd(db, party, today);
  const dues = openDues(db, party.id);
  const next = dues.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const payments = db.entries
    .filter((entry) => entry.partyId === party.id && (entry.entryType === "PaymentReceived" || entry.entryType === "PaymentMade") && !entry.isReversed)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  const last = payments[0];
  const group = db.groups.find((item) => item.id === party.groupId);
  const collector = db.users.find((item) => item.id === party.assignedCollectorId);
  let status: Customer["status"] = "open";
  if (party.currentBalancePaisa < 0) status = "advance";
  else if (party.currentBalancePaisa === 0) status = "settled";
  else if (dpd !== null && dpd > 0) status = "overdue";
  else if (dpd === 0) status = "dueToday";

  return {
    id: party.id,
    code: party.code,
    name: party.name,
    nameEn: party.nameEn,
    phoneE164: party.phoneE164,
    altPhoneE164: party.altPhoneE164,
    address: party.address,
    area: party.area,
    groupId: party.groupId,
    groupName: group?.name,
    creditLimit: money(party.creditLimitPaisa),
    creditDays: party.creditDays,
    preferredLanguage: party.preferredLanguage,
    preferredChannel: party.preferredChannel,
    assignedCollectorId: party.assignedCollectorId,
    assignedCollectorName: collector?.fullName,
    notes: party.notes,
    balance: money(party.currentBalancePaisa),
    overdue: money(overduePaisa(db, party.id, today)),
    dpd: dpd !== null && dpd > 0 ? dpd : dpd === 0 ? 0 : null,
    nextDueDate: next?.dueDate,
    lastPaymentDate: last?.entryDate,
    lastPaymentAmount: last ? money(last.amountPaisa) : undefined,
    status,
    doNotRemind: party.doNotRemind,
    smsConsent: party.smsConsent,
    whatsAppConsent: party.whatsAppConsent,
    isArchived: party.isArchived,
    rowVersion: String(party.rowVersion),
    statementPath: party.statementToken ? `/s/${party.statementToken}` : undefined,
  };
}

export function mapEntry(db: AppDatabase, entry: Database["entries"][number]): LedgerEntry {
  const user = db.users.find((item) => item.id === entry.createdBy);
  return {
    id: entry.id,
    partyId: entry.partyId,
    entryType: entry.entryType,
    direction: entry.direction,
    amount: money(entry.amountPaisa),
    entryDate: entry.entryDate,
    documentNo: entry.documentNo,
    sequenceNo: entry.sequenceNo,
    balanceAfter: money(entry.balanceAfterPaisa),
    paymentMethod: entry.paymentMethod,
    referenceNo: entry.referenceNo,
    note: entry.note,
    dueDate: entry.dueDate,
    isReversed: entry.isReversed,
    reversalOfEntryId: entry.reversalOfEntryId,
    reversedByEntryId: entry.reversedByEntryId,
    reversalReason: entry.reversalReason,
    correctionOfEntryId: entry.correctionOfEntryId,
    createdAtUtc: entry.createdAtUtc,
    createdByName: user?.fullName ?? "",
  };
}

export function mapPromise(db: AppDatabase, promise: DbPromise): PromiseDto {
  const customer = db.parties.find((party) => party.id === promise.partyId);
  return {
    id: promise.id,
    customerId: promise.partyId,
    customerName: customer?.name ?? "",
    amount: money(promise.amountPaisa),
    promiseDate: promise.promiseDate,
    status: promise.status,
    amountPaid: money(promise.amountPaidPaisa),
    note: promise.note,
    channel: promise.channel,
    createdAtUtc: promise.createdAtUtc,
  };
}

export function mapMessage(db: AppDatabase, message: DbMessage) {
  const party = db.parties.find((item) => item.id === message.partyId);
  return {
    id: message.id,
    partyId: message.partyId,
    partyName: party?.name,
    channel: message.channel,
    language: message.language,
    renderedBody: message.renderedBody,
    toPhoneE164: message.toPhoneE164,
    status: message.status,
    failureReason: message.failureReason,
    segments: message.segments,
    cost: money(message.costPaisa),
    triggerType: message.triggerType,
    createdAtUtc: message.createdAtUtc,
  };
}

export function mapMember(db: AppDatabase, membershipId: string): Member {
  const membership = db.memberships.find((item) => item.id === membershipId)!;
  const user = db.users.find((item) => item.id === membership.userId)!;
  const assigned = db.parties.filter(
    (party) => party.tenantId === membership.tenantId && party.assignedCollectorId === user.id && !party.isDeleted,
  ).length;
  return {
    id: membership.id,
    userId: user.id,
    fullName: user.fullName,
    phoneE164: user.phoneE164,
    role: membership.role,
    isActive: membership.isActive,
    subtitle: membership.subtitle,
    assignedCustomers: assigned,
  };
}

export function mapAudit(db: AppDatabase, row: DbAudit) {
  const user = db.users.find((item) => item.id === row.userId);
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorName: user?.fullName ?? "",
    atUtc: row.atUtc,
    before: row.before,
    after: row.after,
  };
}

export function agingReport(db: Database, parties: DbParty[], today: string): PartyAging {
  const sums = { current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90: 0, overdue: 0 };
  const people: Record<AgingBucket["key"], Set<string>> = {
    b0_30: new Set(),
    b31_60: new Set(),
    b61_90: new Set(),
    b90: new Set(),
  };
  for (const party of parties) {
    for (const due of openDues(db, party.id)) {
      const left = dueRemaining(due);
      const dpd = diffDays(today, due.dueDate);
      if (dpd <= 0) sums.current += left;
      else if (dpd <= 30) sums.b1_30 += left;
      else if (dpd <= 60) sums.b31_60 += left;
      else if (dpd <= 90) sums.b61_90 += left;
      else sums.b90 += left;
      if (dpd > 0) sums.overdue += left;
      const key: AgingBucket["key"] = dpd <= 30 ? "b0_30" : dpd <= 60 ? "b31_60" : dpd <= 90 ? "b61_90" : "b90";
      if (left > 0) people[key].add(party.id);
    }
  }
  const buckets: AgingBucket[] = [
    { key: "b0_30", labelKey: "b0_30", amount: money(sums.current + sums.b1_30), customers: people.b0_30.size },
    { key: "b31_60", labelKey: "b31_60", amount: money(sums.b31_60), customers: people.b31_60.size },
    { key: "b61_90", labelKey: "b61_90", amount: money(sums.b61_90), customers: people.b61_90.size },
    { key: "b90", labelKey: "b90", amount: money(sums.b90), customers: people.b90.size },
  ];
  return {
    current: money(sums.current),
    b1_30: money(sums.b1_30),
    b31_60: money(sums.b31_60),
    b61_90: money(sums.b61_90),
    b90: money(sums.b90),
    overdue: money(sums.overdue),
    buckets,
  };
}

export function meFrom(db: AppDatabase, userId: string, tenantId: string) {
  const user = db.users.find((item) => item.id === userId)!;
  const memberships = db.memberships
    .filter((item) => item.userId === userId)
    .map((item) => {
      const tenant = db.tenants.find((row) => row.id === item.tenantId)!;
      return {
        id: item.id,
        tenantId: item.tenantId,
        tenantName: tenant.name,
        tenantNameBn: tenant.nameBn,
        role: item.role,
        isActive: item.isActive,
      };
    });
  const current = memberships.find((item) => item.tenantId === tenantId && item.isActive) ?? memberships.find((item) => item.isActive);
  if (!current) throw new Error("NO_MEMBERSHIP");
  return {
    id: user.id,
    fullName: user.fullName,
    phoneE164: user.phoneE164,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    memberships,
    currentTenantId: current.tenantId,
    role: current.role,
    permissions: permissionsFor(current.role),
    platformRole: user.platformRole ?? null,
  };
}

export function localizedAmount(paisa: number, language: "bn" | "en"): string {
  return formatBDT(paisa, { locale: language, withSymbol: false });
}

export function localizedDate(iso: string, language: "bn" | "en"): string {
  return formatDate(iso, language);
}
