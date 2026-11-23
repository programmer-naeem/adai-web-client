import { addDays, diffDays, isIsoDate } from "@/lib/date";
import { asPaisa, paisaToMoneyString, parseMoneyToPaisa } from "@/lib/money";
import type { Role } from "@/lib/permissions";
import { ApiError } from "@/lib/problem";
import type {
  AllocationResult,
  DueStatus,
  EntryType,
  PartyType,
  PaymentMethod,
  PtpStatus,
} from "@/lib/api/types";

export interface EngineActor {
  userId: string;
  role: Role;
  tenantId: string;
  today: string;
  /** Seed and system jobs bypass back-date and period lock. */
  skipPolicy?: boolean;
}

export interface DbTenantSettings {
  defaultCreditDays: number;
  backdateLimitDays: number;
  lockedUntilDate?: string;
  sendWindowStart: string;
  sendWindowEnd: string;
  sendDays: "all" | "sun-thu" | "sat-wed";
  digestTime: string;
  requireCollectionApproval: boolean;
  collectorCanSeeAll: boolean;
  collectorCanRecordCredit: boolean;
  staffReverseWindowMinutes: number;
  minReminderBalancePaisa: number;
  maxRemindersPerCustomerPerDay: number;
  fallbackToSms: boolean;
  receiptsIgnoreOptOut: boolean;
  enforceCreditLimit: boolean;
  defaultLanguage: "bn" | "en";
  skipFridayJummah: boolean;
  notifyOnEntry: boolean;
}

export interface DbUser {
  id: string;
  phoneE164: string;
  fullName: string;
  email?: string;
  password: string;
  preferredLanguage: "bn" | "en";
  status: "Active";
}

export interface DbMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: Role;
  isActive: boolean;
  subtitle: string;
}

export interface DbTenant {
  id: string;
  name: string;
  nameBn: string;
  businessType: string;
  phoneE164: string;
  email?: string;
  address: string;
  logoText: string;
  status: "Trial" | "Active" | "PastDue" | "Suspended" | "Cancelled";
  trialEndsOn?: string;
  planName: string;
  maxCustomers: number;
  settings: DbTenantSettings;
}

export interface DbGroup {
  id: string;
  tenantId: string;
  name: string;
  color: string;
}

export interface DbParty {
  id: string;
  tenantId: string;
  partyType: PartyType;
  code: string;
  name: string;
  nameEn?: string;
  phoneE164: string;
  altPhoneE164?: string;
  address?: string;
  area: string;
  groupId?: string;
  creditLimitPaisa: number;
  creditDays: number;
  preferredLanguage: "bn" | "en";
  preferredChannel: "Sms" | "WhatsApp" | "None";
  assignedCollectorId?: string;
  notes?: string;
  currentBalancePaisa: number;
  doNotRemind: boolean;
  smsConsent: "OptedIn" | "OptedOut" | "Unknown";
  whatsAppConsent: "OptedIn" | "OptedOut" | "Unknown";
  isArchived: boolean;
  isDeleted: boolean;
  rowVersion: number;
  createdAtUtc: string;
  statementToken?: string;
  statementExpiresOn?: string;
}

export interface DbEntry {
  id: string;
  tenantId: string;
  partyId: string;
  entryType: EntryType;
  direction: "Dr" | "Cr";
  amountPaisa: number;
  entryDate: string;
  documentNo: string;
  sequenceNo: number;
  balanceAfterPaisa: number;
  paymentMethod?: PaymentMethod;
  referenceNo?: string;
  note?: string;
  dueDate?: string;
  allocatedPaisa: number;
  isReversed: boolean;
  reversalOfEntryId?: string;
  reversedByEntryId?: string;
  reversalReason?: string;
  correctionOfEntryId?: string;
  createdAtUtc: string;
  createdBy: string;
  idempotencyKey?: string;
}

export interface DbDue {
  id: string;
  tenantId: string;
  partyId: string;
  sourceEntryId: string;
  documentNo: string;
  originalPaisa: number;
  allocatedPaisa: number;
  dueDate: string;
  entryDate: string;
  status: DueStatus;
}

export interface DbAllocation {
  id: string;
  tenantId: string;
  creditEntryId: string;
  dueItemId: string;
  amountPaisa: number;
  isReversed: boolean;
}

export interface DbPromise {
  id: string;
  tenantId: string;
  partyId: string;
  amountPaisa: number;
  amountPaidPaisa: number;
  promiseDate: string;
  status: PtpStatus;
  note?: string;
  channel: "call" | "visit" | "WhatsApp";
  createdBy: string;
  createdOn: string;
  createdAtUtc: string;
  supersededById?: string;
  cancelReason?: string;
}

export interface EngineResult {
  entry: DbEntry;
  allocations: DbAllocation[];
  unallocatedPaisa: number;
  creditLimitExceeded: boolean;
  possibleDuplicate: boolean;
  promiseUpdated?: { id: string; status: PtpStatus };
}

export interface Database {
  users: DbUser[];
  memberships: DbMembership[];
  tenants: DbTenant[];
  groups: DbGroup[];
  parties: DbParty[];
  entries: DbEntry[];
  dues: DbDue[];
  allocations: DbAllocation[];
  promises: DbPromise[];
  sequences: { tenantId: string; docType: string; next: number }[];
  idempotency: { tenantId: string; key: string; hash: string; responseJson: string }[];
}

export function emptyDatabase(): Database {
  return {
    users: [],
    memberships: [],
    tenants: [],
    groups: [],
    parties: [],
    entries: [],
    dues: [],
    allocations: [],
    promises: [],
    sequences: [],
    idempotency: [],
  };
}

export function uid(): string {
  return globalThis.crypto.randomUUID();
}

export function businessError(rule: string, code = "BUSINESS_RULE_VIOLATION"): ApiError {
  return new ApiError(422, code, { rule, title: rule });
}

export function validation(errors: Record<string, string[]>): ApiError {
  return new ApiError(400, "VALIDATION_ERROR", { errors, title: "Validation failed" });
}

const MFS: PaymentMethod[] = ["Bkash", "Nagad", "Rocket", "Bank", "Cheque"];

export function directionFor(partyType: PartyType, entryType: EntryType, original?: "Dr" | "Cr"): "Dr" | "Cr" {
  if (entryType === "Reversal") {
    if (!original) throw new Error("Reversal requires the original direction");
    return original === "Dr" ? "Cr" : "Dr";
  }
  if (partyType === "Customer") {
    if (["OpeningBalance", "CreditSale", "Refund"].includes(entryType)) return "Dr";
    return "Cr";
  }
  if (["OpeningBalance", "CreditPurchase"].includes(entryType)) return "Cr";
  return "Dr";
}

export function createsDue(partyType: PartyType, entryType: EntryType): boolean {
  if (partyType === "Customer") return entryType === "CreditSale" || entryType === "OpeningBalance";
  return entryType === "CreditPurchase" || entryType === "OpeningBalance";
}

export function allocatesToDues(partyType: PartyType, entryType: EntryType): boolean {
  if (partyType === "Customer") return ["PaymentReceived", "Discount", "WriteOff", "SalesReturn"].includes(entryType);
  return entryType === "PaymentMade" || entryType === "PurchaseReturn";
}

export function dueRemaining(due: DbDue): number {
  return due.originalPaisa - due.allocatedPaisa;
}

export function refreshDue(due: DbDue): void {
  if (due.status === "Cancelled") return;
  const left = dueRemaining(due);
  if (left <= 0) due.status = "Paid";
  else if (due.allocatedPaisa > 0) due.status = "PartiallyPaid";
  else due.status = "Open";
}

export function openDues(db: Database, partyId: string): DbDue[] {
  return db.dues
    .filter((due) => due.partyId === partyId && (due.status === "Open" || due.status === "PartiallyPaid"))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.entryDate.localeCompare(b.entryDate) || a.id.localeCompare(b.id));
}

export function partyById(db: Database, id: string, tenantId: string): DbParty {
  const party = db.parties.find((item) => item.id === id && item.tenantId === tenantId && !item.isDeleted);
  if (!party) throw new ApiError(404, "NOT_FOUND");
  return party;
}

function tenantOf(db: Database, tenantId: string): DbTenant {
  const tenant = db.tenants.find((item) => item.id === tenantId);
  if (!tenant) throw new ApiError(404, "NOT_FOUND");
  return tenant;
}

function nextDocument(db: Database, tenantId: string, docType: string, prefix: string): string {
  let row = db.sequences.find((item) => item.tenantId === tenantId && item.docType === docType);
  if (!row) {
    row = { tenantId, docType, next: 1 };
    db.sequences.push(row);
  }
  const value = row.next++;
  return `${prefix}-${String(value).padStart(6, "0")}`;
}

const PREFIX: Record<string, string> = {
  CreditSale: "DUE",
  OpeningBalance: "OB",
  PaymentReceived: "RCPT",
  Discount: "ADJ",
  WriteOff: "ADJ",
  SalesReturn: "ADJ",
  Refund: "ADJ",
  CreditPurchase: "PUR",
  PaymentMade: "PAY",
  PurchaseReturn: "ADJ",
  Reversal: "REV",
};

function assertDatePolicy(actor: EngineActor, db: Database, entryDate: string): void {
  if (!isIsoDate(entryDate)) throw validation({ entryDate: ["DATE_INVALID"] });
  if (actor.skipPolicy) return;
  const tenant = tenantOf(db, actor.tenantId);
  if (entryDate > actor.today) throw validation({ entryDate: ["FUTURE_DATE"] });
  if (tenant.settings.lockedUntilDate && entryDate <= tenant.settings.lockedUntilDate) {
    throw businessError("BR-2.7");
  }
  const staffLike = actor.role === "Staff" || actor.role === "Collector";
  if (staffLike && entryDate !== actor.today) throw businessError("BR-2.6");
  if (!staffLike && diffDays(actor.today, entryDate) > tenant.settings.backdateLimitDays) {
    throw businessError("BR-2.6");
  }
}

function assertAmount(amount: string): number {
  let paisa: number;
  try {
    paisa = parseMoneyToPaisa(amount);
  } catch {
    throw validation({ amount: ["AMOUNT_INVALID"] });
  }
  if (paisa <= 0 || paisa > 99_999_999_999) throw validation({ amount: ["AMOUNT_INVALID"] });
  return paisa;
}

function applyBalance(party: DbParty, direction: "Dr" | "Cr", amount: number): void {
  party.currentBalancePaisa += direction === "Dr" ? amount : -amount;
  party.rowVersion += 1;
}

function allocate(db: Database, entry: DbEntry, budget: number, manual?: { dueItemId: string; amountPaisa: number }[]): DbAllocation[] {
  const created: DbAllocation[] = [];
  let left = budget;
  const targets = manual
    ? manual.map((item) => {
        const due = db.dues.find((row) => row.id === item.dueItemId && row.partyId === entry.partyId);
        if (!due || (due.status !== "Open" && due.status !== "PartiallyPaid")) {
          throw validation({ allocations: ["DUE_NOT_OPEN"] });
        }
        return { due, cap: item.amountPaisa };
      })
    : openDues(db, entry.partyId).map((due) => ({ due, cap: dueRemaining(due) }));

  for (const target of targets) {
    if (left <= 0) break;
    const room = dueRemaining(target.due);
    const take = Math.min(room, target.cap, left);
    if (take <= 0) continue;
    const row: DbAllocation = {
      id: uid(),
      tenantId: entry.tenantId,
      creditEntryId: entry.id,
      dueItemId: target.due.id,
      amountPaisa: take,
      isReversed: false,
    };
    db.allocations.push(row);
    target.due.allocatedPaisa += take;
    entry.allocatedPaisa += take;
    left -= take;
    refreshDue(target.due);
    created.push(row);
  }
  return created;
}

function sweepUnallocated(db: Database, partyId: string): void {
  const credits = db.entries
    .filter((entry) => {
      if (entry.partyId !== partyId || entry.isReversed) return false;
      const party = db.parties.find((item) => item.id === partyId);
      if (!party) return false;
      return allocatesToDues(party.partyType, entry.entryType) && entry.allocatedPaisa < entry.amountPaisa;
    })
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.sequenceNo - b.sequenceNo);
  for (const credit of credits) {
    const left = credit.amountPaisa - credit.allocatedPaisa;
    if (left > 0) allocate(db, credit, left);
  }
}

export function evaluatePromises(db: Database, partyId: string, today: string): { id: string; status: PtpStatus } | undefined {
  let updated: { id: string; status: PtpStatus } | undefined;
  for (const promise of db.promises.filter((item) => item.partyId === partyId && item.status === "Open")) {
    const paid = db.entries
      .filter(
        (entry) =>
          entry.partyId === partyId &&
          entry.entryType === "PaymentReceived" &&
          !entry.isReversed &&
          entry.entryDate >= promise.createdOn &&
          entry.entryDate <= promise.promiseDate,
      )
      .reduce((sum, entry) => sum + entry.amountPaisa, 0);
    promise.amountPaidPaisa = paid;
    if (paid >= promise.amountPaisa) promise.status = "Kept";
    else if (today > promise.promiseDate) promise.status = paid > 0 ? "PartiallyKept" : "Broken";
    if (promise.status !== "Open") updated = { id: promise.id, status: promise.status };
  }
  return updated;
}

export interface PostEntryInput {
  partyId: string;
  entryType: EntryType;
  amount: string;
  entryDate: string;
  dueDate?: string;
  note?: string;
  method?: PaymentMethod;
  referenceNo?: string;
  manualAllocations?: { dueItemId: string; amount: string }[];
  idempotencyKey?: string;
  correctionOfEntryId?: string;
  reversalOf?: DbEntry;
}

export function postEntry(db: Database, actor: EngineActor, input: PostEntryInput): EngineResult {
  const party = partyById(db, input.partyId, actor.tenantId);
  if (party.isArchived) throw businessError("BR-4.6", "PARTY_ARCHIVED");
  const amount = input.reversalOf ? input.reversalOf.amountPaisa : assertAmount(input.amount);
  if (!input.reversalOf) assertDatePolicy(actor, db, input.entryDate);
  if (input.method && MFS.includes(input.method) && !input.referenceNo?.trim()) {
    throw validation({ referenceNo: ["REFERENCE_REQUIRED"] });
  }

  let possibleDuplicate = false;
  if (input.entryType === "PaymentReceived" && input.method) {
    const cutoff = Date.now() - 2 * 60 * 1000;
    possibleDuplicate = db.entries.some(
      (entry) =>
        entry.partyId === party.id &&
        entry.entryType === "PaymentReceived" &&
        entry.amountPaisa === amount &&
        entry.paymentMethod === input.method &&
        entry.createdBy === actor.userId &&
        !entry.isReversed &&
        Date.parse(entry.createdAtUtc) >= cutoff,
    );
  }

  const direction = directionFor(party.partyType, input.entryType, input.reversalOf?.direction);
  const sequenceNo = db.entries.filter((entry) => entry.partyId === party.id).length + 1;
  const docType = input.entryType;
  const entry: DbEntry = {
    id: uid(),
    tenantId: actor.tenantId,
    partyId: party.id,
    entryType: input.entryType,
    direction,
    amountPaisa: amount,
    entryDate: input.entryDate,
    documentNo: nextDocument(db, actor.tenantId, docType, PREFIX[docType] ?? "DOC"),
    sequenceNo,
    balanceAfterPaisa: 0,
    paymentMethod: input.method,
    referenceNo: input.referenceNo,
    note: input.note,
    dueDate: input.dueDate,
    allocatedPaisa: 0,
    isReversed: false,
    reversalOfEntryId: input.reversalOf?.id,
    correctionOfEntryId: input.correctionOfEntryId,
    createdAtUtc: actor.skipPolicy ? `${input.entryDate}T06:00:00.000Z` : new Date().toISOString(),
    createdBy: actor.userId,
    idempotencyKey: input.idempotencyKey,
  };

  applyBalance(party, direction, amount);
  entry.balanceAfterPaisa = party.currentBalancePaisa;
  db.entries.push(entry);

  if (createsDue(party.partyType, input.entryType)) {
    const dueDate = input.dueDate && isIsoDate(input.dueDate) ? input.dueDate : addDays(input.entryDate, party.creditDays);
    entry.dueDate = dueDate;
    db.dues.push({
      id: uid(),
      tenantId: actor.tenantId,
      partyId: party.id,
      sourceEntryId: entry.id,
      documentNo: entry.documentNo,
      originalPaisa: amount,
      allocatedPaisa: 0,
      dueDate,
      entryDate: input.entryDate,
      status: "Open",
    });
    sweepUnallocated(db, party.id);
  }

  let allocations: DbAllocation[] = [];
  if (allocatesToDues(party.partyType, input.entryType)) {
    const manual = input.manualAllocations?.map((item) => ({
      dueItemId: item.dueItemId,
      amountPaisa: assertAmount(item.amount),
    }));
    allocations = allocate(db, entry, amount, manual);
  }

  const promiseUpdated = input.entryType === "PaymentReceived" ? evaluatePromises(db, party.id, actor.today) : undefined;
  const creditLimitExceeded =
    party.partyType === "Customer" &&
    party.creditLimitPaisa > 0 &&
    party.currentBalancePaisa > party.creditLimitPaisa &&
    (input.entryType === "CreditSale" || input.entryType === "OpeningBalance");

  const unallocatedPaisa = allocatesToDues(party.partyType, input.entryType) ? entry.amountPaisa - entry.allocatedPaisa : 0;

  return { entry, allocations, unallocatedPaisa, creditLimitExceeded, possibleDuplicate, promiseUpdated };
}

export function allocationPreview(db: Database, tenantId: string, partyId: string, amount: string): DbAllocation[] {
  const party = partyById(db, partyId, tenantId);
  const paisa = assertAmount(amount);
  const ghost: DbEntry = {
    id: "preview",
    tenantId,
    partyId: party.id,
    entryType: party.partyType === "Customer" ? "PaymentReceived" : "PaymentMade",
    direction: "Cr",
    amountPaisa: paisa,
    entryDate: "",
    documentNo: "",
    sequenceNo: 0,
    balanceAfterPaisa: 0,
    allocatedPaisa: 0,
    isReversed: false,
    createdAtUtc: "",
    createdBy: "",
  };
  const clone: Database = {
    ...db,
    dues: db.dues.map((due) => ({ ...due })),
    allocations: [...db.allocations],
    entries: [...db.entries, ghost],
  };
  return allocate(clone, ghost, paisa);
}

export function reverseEntry(db: Database, actor: EngineActor, entryId: string, reason: string): EngineResult {
  if (!reason.trim()) throw validation({ reason: ["REASON_REQUIRED"] });
  const entry = db.entries.find((item) => item.id === entryId && item.tenantId === actor.tenantId);
  if (!entry) throw new ApiError(404, "NOT_FOUND");
  if (entry.isReversed || entry.entryType === "Reversal") throw businessError("BR-4.4");
  if (actor.role === "Collector") throw new ApiError(403, "FORBIDDEN");
  if (actor.role === "Staff") {
    if (entry.createdBy !== actor.userId) throw new ApiError(403, "FORBIDDEN");
    const ageMinutes = (Date.now() - Date.parse(entry.createdAtUtc)) / 60_000;
    const windowMinutes = tenantOf(db, actor.tenantId).settings.staffReverseWindowMinutes;
    if (ageMinutes > windowMinutes) throw businessError("BR-4.5");
  } else if (actor.role !== "Owner" && actor.role !== "Manager") {
    throw new ApiError(403, "FORBIDDEN");
  }
  if (!actor.skipPolicy) assertDatePolicy(actor, db, actor.today);

  const party = partyById(db, entry.partyId, actor.tenantId);
  if (allocatesToDues(party.partyType, entry.entryType)) {
    for (const allocation of db.allocations.filter((item) => item.creditEntryId === entry.id && !item.isReversed)) {
      allocation.isReversed = true;
      const due = db.dues.find((item) => item.id === allocation.dueItemId);
      if (due && due.status !== "Cancelled") {
        due.allocatedPaisa -= allocation.amountPaisa;
        refreshDue(due);
      }
    }
  }
  const due = db.dues.find((item) => item.sourceEntryId === entry.id && item.status !== "Cancelled");
  if (due) {
    for (const allocation of db.allocations.filter((item) => item.dueItemId === due.id && !item.isReversed)) {
      allocation.isReversed = true;
      const credit = db.entries.find((item) => item.id === allocation.creditEntryId);
      if (credit) credit.allocatedPaisa -= allocation.amountPaisa;
    }
    due.status = "Cancelled";
    due.allocatedPaisa = 0;
  }

  const result = postEntry(db, { ...actor, skipPolicy: true }, {
    partyId: entry.partyId,
    entryType: "Reversal",
    amount: paisaToMoneyString(entry.amountPaisa),
    entryDate: actor.today,
    note: reason,
    reversalOf: entry,
  });
  entry.isReversed = true;
  entry.reversedByEntryId = result.entry.id;
  entry.reversalReason = reason;
  result.entry.reversalReason = reason;
  sweepUnallocated(db, entry.partyId);
  return result;
}

export function correctEntry(
  db: Database,
  actor: EngineActor,
  entryId: string,
  reason: string,
  replacement: Omit<PostEntryInput, "partyId" | "entryType"> & { entryType?: EntryType },
): { reversal: EngineResult; replacement: EngineResult } {
  const original = db.entries.find((item) => item.id === entryId && item.tenantId === actor.tenantId);
  if (!original) throw new ApiError(404, "NOT_FOUND");
  const reversal = reverseEntry(db, actor, entryId, reason);
  const replacementResult = postEntry(db, actor, {
    partyId: original.partyId,
    entryType: replacement.entryType ?? (original.entryType === "Reversal" ? "CreditSale" : original.entryType),
    amount: replacement.amount,
    entryDate: replacement.entryDate,
    dueDate: replacement.dueDate,
    note: replacement.note,
    method: replacement.method ?? original.paymentMethod,
    referenceNo: replacement.referenceNo,
    correctionOfEntryId: original.id,
    idempotencyKey: replacement.idempotencyKey,
  });
  return { reversal, replacement: replacementResult };
}

export function customerDpd(db: Database, party: DbParty, today: string): number | null {
  const dues = openDues(db, party.id);
  if (dues.length === 0) return null;
  return Math.max(...dues.map((due) => diffDays(today, due.dueDate)));
}

export function overduePaisa(db: Database, partyId: string, today: string): number {
  return openDues(db, partyId)
    .filter((due) => diffDays(today, due.dueDate) > 0)
    .reduce((sum, due) => sum + dueRemaining(due), 0);
}

/** BR-5.8: remaining open dues − unallocated credit = balance. */
export function balanceInvariantHolds(db: Database, partyId: string): boolean {
  const party = db.parties.find((item) => item.id === partyId);
  if (!party || party.partyType !== "Customer") return true;
  const remaining = openDues(db, partyId).reduce((sum, due) => sum + dueRemaining(due), 0);
  const unallocated = db.entries
    .filter((entry) => entry.partyId === partyId && !entry.isReversed && allocatesToDues("Customer", entry.entryType))
    .reduce((sum, entry) => sum + (entry.amountPaisa - entry.allocatedPaisa), 0);
  return remaining - unallocated === party.currentBalancePaisa;
}

export function toAllocationResults(db: Database, allocations: DbAllocation[]): AllocationResult[] {
  return allocations.map((allocation) => {
    const due = db.dues.find((item) => item.id === allocation.dueItemId)!;
    return {
      dueItemId: due.id,
      documentNo: due.documentNo,
      amount: paisaToMoneyString(asPaisa(allocation.amountPaisa)),
      dueItemStatus: due.status,
    };
  });
}

export function assertReadableMoney(amount: string): number {
  return assertAmount(amount);
}
