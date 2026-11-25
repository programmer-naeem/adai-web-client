import type { Permission, Role } from "@/lib/permissions";

/** Decimal string, e.g. "12500.00". Never a JSON number (plan §11.1). */
export type MoneyString = string;

export type PartyType = "Customer" | "Supplier";
export type Language = "bn" | "en";
export type Channel = "Sms" | "WhatsApp" | "None";
export type PaymentMethod = "Cash" | "Bkash" | "Nagad" | "Rocket" | "Bank" | "Cheque" | "Card" | "Other";
export type EntryType =
  | "OpeningBalance"
  | "CreditSale"
  | "PaymentReceived"
  | "Discount"
  | "WriteOff"
  | "SalesReturn"
  | "Refund"
  | "CreditPurchase"
  | "PaymentMade"
  | "PurchaseReturn"
  | "Reversal";
export type Direction = "Dr" | "Cr";
export type DueStatus = "Open" | "PartiallyPaid" | "Paid" | "Cancelled";
export type PtpStatus = "Open" | "Kept" | "PartiallyKept" | "Broken" | "Cancelled";
export type MessageStatus =
  | "Queued"
  | "Sending"
  | "Sent"
  | "Delivered"
  | "Read"
  | "Failed"
  | "Blocked"
  | "Cancelled";
export type ConsentStatus = "OptedIn" | "OptedOut" | "Unknown";
export type SubscriptionStatus = "Trial" | "Active" | "PastDue" | "Suspended" | "Cancelled";
export type PlatformRole = "SuperAdmin" | "Support";
export type InvoiceStatus = "Open" | "Paid";

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MembershipSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantNameBn: string;
  role: Role;
  isActive: boolean;
}

export interface Me {
  id: string;
  fullName: string;
  phoneE164: string;
  email?: string;
  preferredLanguage: Language;
  memberships: MembershipSummary[];
  currentTenantId: string;
  role: Role;
  permissions: Permission[];
  platformRole: PlatformRole | null;
}

export interface AuthResult extends AuthTokens {
  user: Me;
}

export interface OtpRequest {
  phone: string;
  purpose: "signup" | "login" | "reset";
}

export interface OtpRequestResponse {
  expiresInSeconds: number;
  retryAfterSeconds: number;
  /** Present only in mock mode so demos can proceed without an SMS gateway. */
  devCode?: string;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
  purpose: "signup" | "login" | "reset";
}

export interface OtpVerifyResponse {
  ticket?: string;
  auth?: AuthResult;
}

export interface SignupRequest {
  ticket: string;
  fullName: string;
  password: string;
  businessName: string;
  businessNameBn?: string;
  businessType?: string;
  address?: string;
  defaultCreditDays?: number;
  language?: Language;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface ResetPasswordRequest {
  ticket: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  current: string;
  newPassword: string;
}

export interface SwitchTenantRequest {
  tenantId: string;
}

export interface UpdateMeRequest {
  fullName?: string;
  email?: string;
  preferredLanguage?: Language;
}

export interface SessionDto {
  id: string;
  deviceName: string;
  platform: string;
  createdAtUtc: string;
  lastSeenAtUtc: string;
  current: boolean;
}

export interface TenantSettings {
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
  minReminderBalance: MoneyString;
  maxRemindersPerCustomerPerDay: number;
  fallbackToSms: boolean;
  receiptsIgnoreOptOut: boolean;
  enforceCreditLimit: boolean;
  defaultLanguage: Language;
  skipFridayJummah: boolean;
  notifyOnEntry: boolean;
}

export interface TenantProfile {
  id: string;
  name: string;
  nameBn: string;
  businessType: string;
  phoneE164: string;
  email?: string;
  address: string;
  logoText: string;
  timeZone: "Asia/Dhaka";
  currencyCode: "BDT";
  status: SubscriptionStatus;
  settings: TenantSettings;
  trialEndsOn?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  nameBn?: string;
  businessType?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PartyGroup {
  id: string;
  name: string;
  color: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  phoneE164: string;
  altPhoneE164?: string;
  address?: string;
  area: string;
  groupId?: string;
  groupName?: string;
  creditLimit: MoneyString;
  creditDays: number;
  preferredLanguage: Language;
  preferredChannel: Channel;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  notes?: string;
  balance: MoneyString;
  overdue: MoneyString;
  dpd: number | null;
  nextDueDate?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: MoneyString;
  status: "overdue" | "dueToday" | "open" | "advance" | "settled";
  doNotRemind: boolean;
  smsConsent: ConsentStatus;
  whatsAppConsent: ConsentStatus;
  isArchived: boolean;
  rowVersion: string;
  statementPath?: string;
}

export interface CustomerQuery {
  search?: string;
  filter?: "all" | "overdue" | "due" | "settled";
  groupId?: string;
  area?: string;
  collectorId?: string;
  sort?: "balance" | "name" | "dpd";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}

export interface CustomerInput {
  name: string;
  nameEn?: string;
  phone: string;
  altPhone?: string;
  address?: string;
  area?: string;
  groupId?: string;
  creditLimit?: MoneyString;
  creditDays?: number;
  preferredLanguage?: Language;
  preferredChannel?: Channel;
  assignedCollectorId?: string;
  notes?: string;
  openingBalance?: MoneyString;
  openingDueDate?: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  entryType: EntryType;
  direction: Direction;
  amount: MoneyString;
  entryDate: string;
  documentNo: string;
  sequenceNo: number;
  balanceAfter: MoneyString;
  paymentMethod?: PaymentMethod;
  referenceNo?: string;
  note?: string;
  dueDate?: string;
  isReversed: boolean;
  reversalOfEntryId?: string;
  reversalOfDocumentNo?: string;
  reversedByEntryId?: string;
  reversedByDocumentNo?: string;
  reversalReason?: string;
  correctionOfEntryId?: string;
  createdAtUtc: string;
  createdByName: string;
}

export interface LedgerQuery {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}

export interface AllocationResult {
  dueItemId: string;
  documentNo: string;
  amount: MoneyString;
  dueItemStatus: DueStatus;
}

export interface LedgerWriteResult {
  entryId: string;
  documentNo: string;
  balanceAfter: MoneyString;
  allocations: AllocationResult[];
  unallocated: MoneyString;
  creditLimitExceeded?: boolean;
  possibleDuplicate?: boolean;
  promiseUpdated?: { id: string; status: PtpStatus };
  notification?: { messageId: string; channel: Channel; status: MessageStatus };
}

export interface CreditSaleRequest {
  customerId: string;
  amount: MoneyString;
  entryDate: string;
  dueDate?: string;
  referenceNo?: string;
  note?: string;
  notify?: boolean;
}

export interface PaymentReceivedRequest {
  customerId: string;
  amount: MoneyString;
  method: PaymentMethod;
  referenceNo?: string;
  entryDate: string;
  note?: string;
  allocations?: { dueItemId: string; amount: MoneyString }[];
  notify?: boolean;
}

export interface CreditPurchaseRequest {
  supplierId: string;
  amount: MoneyString;
  entryDate: string;
  dueDate?: string;
  referenceNo?: string;
  note?: string;
}

export interface PaymentMadeRequest {
  supplierId: string;
  amount: MoneyString;
  method: PaymentMethod;
  referenceNo?: string;
  entryDate: string;
  note?: string;
}

export interface AdjustmentRequest {
  partyId: string;
  type: "Discount" | "WriteOff" | "SalesReturn" | "PurchaseReturn" | "Refund" | "OpeningBalance";
  amount: MoneyString;
  entryDate: string;
  reason: string;
}

export interface ReverseRequest {
  reason: string;
}

export interface CorrectRequest {
  reason: string;
  amount: MoneyString;
  entryDate: string;
  note?: string;
  method?: PaymentMethod;
  dueDate?: string;
}

export interface AgingBucket {
  key: "b0_30" | "b31_60" | "b61_90" | "b90";
  labelKey: string;
  amount: MoneyString;
  customers: number;
}

export interface PartyAging {
  current: MoneyString;
  b1_30: MoneyString;
  b31_60: MoneyString;
  b61_90: MoneyString;
  b90: MoneyString;
  overdue: MoneyString;
  buckets: AgingBucket[];
}

export interface DashboardSummary {
  receivable: MoneyString;
  payable: MoneyString;
  overdue: MoneyString;
  collectedToday: MoneyString;
  collectedThisMonth: MoneyString;
  ptpDueToday: number;
  walletBalance: MoneyString;
  walletLow: boolean;
  customerCount: number;
  businessName: string;
  businessDate: string;
}

export interface TrendPoint {
  date: string;
  amount: MoneyString;
}

export interface CollectTodayItem {
  customerId: string;
  name: string;
  area: string;
  phoneE164: string;
  balance: MoneyString;
  overdue: MoneyString;
  dpd: number | null;
  reason: "ptp" | "dueToday" | "overdue";
  priority: number;
  promiseDate?: string;
}

export interface PromiseDto {
  id: string;
  customerId: string;
  customerName: string;
  amount: MoneyString;
  promiseDate: string;
  status: PtpStatus;
  amountPaid: MoneyString;
  note?: string;
  channel: "call" | "visit" | "WhatsApp";
  createdAtUtc: string;
}

export interface PromiseInput {
  customerId: string;
  amount: MoneyString;
  promiseDate: string;
  note?: string;
  channel?: "call" | "visit" | "WhatsApp";
}

export interface ContactAttemptInput {
  customerId: string;
  channel: "Call" | "Visit" | "WhatsApp";
  outcome: "Promised" | "Paid" | "NotReachable" | "Disputed" | "Refused";
  note?: string;
}

export interface ContactAttempt extends ContactAttemptInput {
  id: string;
  atUtc: string;
  userName: string;
}

export interface PendingCollection {
  id: string;
  customerId: string;
  customerName: string;
  collectorId: string;
  collectorName: string;
  amount: MoneyString;
  method: PaymentMethod;
  referenceNo?: string;
  note?: string;
  status: "Pending" | "Approved" | "Rejected";
  collectedAtUtc: string;
  rejectReason?: string;
}

export interface CashHandover {
  id: string;
  collectorId: string;
  collectorName: string;
  handoverDate: string;
  declaredAmount: MoneyString;
  confirmedAmount?: MoneyString;
  cashCollected: MoneyString;
  variance?: MoneyString;
  status: "Submitted" | "Confirmed";
  note?: string;
}

export interface MessageTemplate {
  id: string;
  key: string;
  channel: "Sms" | "WhatsApp";
  language: Language;
  name: string;
  description: string;
  body: string;
  whatsAppStatus: "APPROVED" | "PENDING" | "REJECTED" | "NONE";
  isActive: boolean;
}

export interface ReminderRule {
  id: string;
  code: string;
  name: string;
  description: string;
  isEnabled: boolean;
  triggerType: "BeforeDue" | "OnDue" | "AfterDue" | "Ptp" | "MonthlyStatement" | "Escalation";
  offsetDays: number;
  repeatEveryDays?: number;
  maxAttempts: number;
  channel: "Preferred" | "Sms" | "WhatsApp";
  templateKey: string;
}

export interface TemplatePreview {
  text: string;
  segments: number;
  encoding: "gsm7" | "ucs2";
  cost: MoneyString;
  length: number;
}

export interface OutboundMessage {
  id: string;
  partyId?: string;
  partyName?: string;
  channel: "Sms" | "WhatsApp";
  language: Language;
  renderedBody: string;
  toPhoneE164: string;
  status: MessageStatus;
  failureReason?: string;
  segments: number;
  cost: MoneyString;
  triggerType: "Manual" | "Bulk" | "Rule" | "Transaction" | "System";
  createdAtUtc: string;
}

export interface SendMessageRequest {
  partyId: string;
  channel: "Sms" | "WhatsApp";
  templateId?: string;
  body?: string;
}

export interface BulkPreview {
  recipientCount: number;
  estimatedCost: MoneyString;
  samples: { name: string; text: string }[];
}

export interface Wallet {
  balance: MoneyString;
  reserved: MoneyString;
  threshold: MoneyString;
  low: boolean;
}

export interface WalletTransaction {
  id: string;
  type: "TopUp" | "Capture" | "Release" | "Adjustment" | "PlanCredit";
  amount: MoneyString;
  balanceAfter: MoneyString;
  note: string;
  createdAtUtc: string;
}

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  phoneE164: string;
  role: Role;
  isActive: boolean;
  subtitle: string;
  assignedCustomers: number;
}

export interface InviteMemberRequest {
  phone: string;
  fullName: string;
  role: Role;
  subtitle?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  atUtc: string;
  before?: Record<string, string>;
  after?: Record<string, string>;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  entityType?: string;
  entityId?: string;
  readAtUtc?: string;
  createdAtUtc: string;
}

export interface PublicStatement {
  businessName: string;
  businessPhone: string;
  logoText: string;
  address: string;
  customerName: string;
  maskedPhone: string;
  balance: MoneyString;
  overdue: MoneyString;
  language: Language;
  entries: { date: string; label: string; amount: MoneyString; direction: Direction; balanceAfter: MoneyString }[];
}

export interface StatementLink {
  token: string;
  path: string;
  expiresOn: string;
}

export interface SubscriptionInfo {
  planName: string;
  status: SubscriptionStatus;
  trialEndsOn?: string;
  daysLeft?: number;
  maxCustomers: number;
  customerCount: number;
  showExpiryBanner: boolean;
}

export interface SetupChecklist {
  customersAdded: boolean;
  openingBalances: boolean;
  reminderRulesReviewed: boolean;
  testMessageSent: boolean;
  staffInvited: boolean;
}

export interface ImportRowError {
  row: number;
  field: string;
  code: string;
}

export interface ImportPreview {
  id: string;
  totalRows: number;
  validRows: number;
  errors: ImportRowError[];
  committed: boolean;
}

export interface DailyCollectionRow {
  date: string;
  count: number;
  amount: MoneyString;
}

export interface CollectorReportRow {
  collectorId: string;
  name: string;
  role: Role;
  count: number;
  amount: MoneyString;
}

export interface DuesReportRow {
  customerId: string;
  name: string;
  phoneE164: string;
  area: string;
  balance: MoneyString;
  overdue: MoneyString;
  dpd: number | null;
  nextDueDate?: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  kind: "entry" | "message" | "promise" | "contact" | "statement";
  title: string;
  detail?: string;
}

export interface AdminTenantSummary {
  id: string;
  name: string;
  nameBn: string;
  phoneE164: string;
  status: SubscriptionStatus;
  planId: string;
  planName: string;
  ownerName: string;
  customerCount: number;
  walletBalance: MoneyString;
  trialEndsOn?: string;
}

export interface AdminInvoice {
  id: string;
  tenantId: string;
  tenantName: string;
  number: string;
  amount: MoneyString;
  status: InvoiceStatus;
  issuedOn: string;
  paidOn?: string;
  note?: string;
}

export interface AdminTenantDetail extends AdminTenantSummary {
  address: string;
  email?: string;
  maxCustomers: number;
  invoices: AdminInvoice[];
}

export interface AdminPlan {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  monthlyPrice: MoneyString;
  maxCustomers: number;
  includedCredits: MoneyString;
  isActive: boolean;
}

export interface AdminPlanInput {
  code: string;
  name: string;
  nameBn: string;
  monthlyPrice: string;
  maxCustomers: number;
  includedCredits: string;
  isActive: boolean;
}

export interface AdminTenantInput {
  name: string;
  nameBn: string;
  phone: string;
  ownerName: string;
  planId: string;
  address?: string;
}

export interface ChannelRate {
  id: string;
  channel: "Sms" | "WhatsApp";
  pricePerSegment: MoneyString;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  nameBn: string;
}

export interface HolidayInput {
  date: string;
  name: string;
  nameBn: string;
}
