import type { Role } from "@/lib/permissions";
import type {
  AdminInvoice,
  AdminPlan,
  AdminPlanInput,
  AdminTenantDetail,
  AdminTenantInput,
  AdminTenantSummary,
  AdjustmentRequest,
  AppNotification,
  AuditLog,
  AuthResult,
  BulkPreview,
  CashHandover,
  ChannelRate,
  ChangePasswordRequest,
  CollectTodayItem,
  CollectorReportRow,
  ContactAttempt,
  ContactAttemptInput,
  CorrectRequest,
  CreditPurchaseRequest,
  CreditSaleRequest,
  Customer,
  CustomerInput,
  CustomerQuery,
  DailyCollectionRow,
  DashboardSummary,
  DuesReportRow,
  Holiday,
  HolidayInput,
  ImportPreview,
  InviteMemberRequest,
  LedgerEntry,
  LedgerQuery,
  LedgerWriteResult,
  LoginRequest,
  Me,
  Member,
  MessageTemplate,
  OtpRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  OutboundMessage,
  Page,
  PartyAging,
  PartyGroup,
  PaymentMadeRequest,
  PaymentReceivedRequest,
  PendingCollection,
  PromiseDto,
  PromiseInput,
  PublicStatement,
  ReminderRule,
  ResetPasswordRequest,
  ReverseRequest,
  SendMessageRequest,
  SessionDto,
  SetupChecklist,
  SignupRequest,
  StatementLink,
  SubscriptionInfo,
  SubscriptionStatus,
  SwitchTenantRequest,
  TemplatePreview,
  TenantProfile,
  TenantSettings,
  TrendPoint,
  UpdateMeRequest,
  UpdateTenantRequest,
  Wallet,
  WalletTransaction,
} from "@/lib/api/types";

export interface AuthApi {
  requestOtp(body: OtpRequest): Promise<OtpRequestResponse>;
  verifyOtp(body: OtpVerifyRequest): Promise<OtpVerifyResponse>;
  signup(body: SignupRequest): Promise<AuthResult>;
  login(body: LoginRequest): Promise<AuthResult>;
  refresh(body: { refreshToken: string }): Promise<AuthResult>;
  logout(): Promise<void>;
  resetPassword(body: ResetPasswordRequest): Promise<void>;
  changePassword(body: ChangePasswordRequest): Promise<void>;
  switchTenant(body: SwitchTenantRequest): Promise<AuthResult>;
  me(): Promise<Me>;
  updateMe(body: UpdateMeRequest): Promise<Me>;
  sessions(): Promise<SessionDto[]>;
  revokeSession(id: string): Promise<void>;
}

export interface CustomersApi {
  list(query?: CustomerQuery): Promise<Page<Customer>>;
  get(id: string): Promise<Customer>;
  create(body: CustomerInput): Promise<Customer>;
  update(id: string, body: CustomerInput, rowVersion: string): Promise<Customer>;
  remove(id: string): Promise<void>;
  archive(id: string): Promise<Customer>;
  checkDuplicate(phone: string): Promise<{ duplicate: boolean; customerId?: string }>;
  groups(): Promise<PartyGroup[]>;
  ledger(id: string, query?: LedgerQuery): Promise<Page<LedgerEntry>>;
  aging(id: string): Promise<PartyAging>;
  messages(id: string): Promise<OutboundMessage[]>;
  timeline(id: string): Promise<import("@/lib/api/types").TimelineEvent[]>;
  setConsent(id: string, channel: "Sms" | "WhatsApp", status: "OptedIn" | "OptedOut"): Promise<Customer>;
  assignCollector(id: string, collectorId: string | null): Promise<Customer>;
  createStatementLink(id: string): Promise<StatementLink>;
}

export interface SuppliersApi {
  list(query?: CustomerQuery): Promise<Page<Customer>>;
  get(id: string): Promise<Customer>;
  create(body: CustomerInput): Promise<Customer>;
  update(id: string, body: CustomerInput, rowVersion: string): Promise<Customer>;
  remove(id: string): Promise<void>;
  ledger(id: string): Promise<LedgerEntry[]>;
}

export interface LedgerApi {
  creditSale(body: CreditSaleRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
  creditPurchase(body: CreditPurchaseRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
  adjustment(body: AdjustmentRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
  list(query?: { from?: string; to?: string; type?: string; page?: number; pageSize?: number }): Promise<Page<LedgerEntry>>;
  get(id: string): Promise<LedgerEntry>;
  patchNote(id: string, note: string): Promise<LedgerEntry>;
  reverse(id: string, body: ReverseRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
  correct(id: string, body: CorrectRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
}

export interface PaymentsApi {
  receive(body: PaymentReceivedRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
  make(body: PaymentMadeRequest, idempotencyKey: string): Promise<LedgerWriteResult>;
  allocationPreview(customerId: string, amount: string): Promise<LedgerWriteResult["allocations"]>;
}

export interface CollectionsApi {
  today(): Promise<CollectTodayItem[]>;
  overdue(bucket?: "b0_30" | "b31_60" | "b61_90" | "b90"): Promise<CollectTodayItem[]>;
  promises(status?: string): Promise<PromiseDto[]>;
  createPromise(body: PromiseInput): Promise<PromiseDto>;
  updatePromise(id: string, body: Partial<PromiseInput>): Promise<PromiseDto>;
  cancelPromise(id: string, reason: string): Promise<PromiseDto>;
  logContact(body: ContactAttemptInput): Promise<ContactAttempt>;
  pending(): Promise<PendingCollection[]>;
  submitPending(body: PaymentReceivedRequest): Promise<PendingCollection>;
  approvePending(id: string): Promise<LedgerWriteResult>;
  rejectPending(id: string, reason: string): Promise<PendingCollection>;
  handovers(): Promise<CashHandover[]>;
  submitHandover(body: { date: string; declaredAmount: string; note?: string }): Promise<CashHandover>;
  confirmHandover(id: string, body: { confirmedAmount: string; note?: string }): Promise<CashHandover>;
}

export interface RemindersApi {
  templates(filter?: { channel?: "Sms" | "WhatsApp"; language?: "bn" | "en" }): Promise<MessageTemplate[]>;
  updateTemplate(id: string, body: string): Promise<MessageTemplate>;
  preview(body: { templateId?: string; text?: string; partyId?: string; channel: "Sms" | "WhatsApp" }): Promise<TemplatePreview>;
  send(body: SendMessageRequest, idempotencyKey: string): Promise<OutboundMessage>;
  bulkPreview(body: { customerIds: string[]; templateId: string; channel: "Sms" | "WhatsApp" }): Promise<BulkPreview>;
  bulkSend(body: { customerIds: string[]; templateId: string; channel: "Sms" | "WhatsApp" }, idempotencyKey: string): Promise<{ batchId: string; sent: number }>;
  messages(query?: { status?: string }): Promise<OutboundMessage[]>;
  retry(id: string): Promise<OutboundMessage>;
  rules(): Promise<ReminderRule[]>;
  updateRule(id: string, patch: Partial<Pick<ReminderRule, "isEnabled" | "offsetDays" | "channel" | "templateKey">>): Promise<ReminderRule>;
  simulate(date: string): Promise<{ customerId: string; name: string; ruleCode: string; templateKey: string }[]>;
  wallet(): Promise<Wallet>;
  walletTransactions(): Promise<WalletTransaction[]>;
  setThreshold(amount: string): Promise<Wallet>;
}

export interface ReportsApi {
  summary(): Promise<DashboardSummary>;
  aging(): Promise<PartyAging>;
  trends(): Promise<TrendPoint[]>;
  dues(query?: { from?: string; to?: string; collectorId?: string }): Promise<DuesReportRow[]>;
  collections(query?: { from?: string; to?: string }): Promise<DailyCollectionRow[]>;
  collectors(query?: { from?: string; to?: string }): Promise<CollectorReportRow[]>;
  exportCsv(report: "dues" | "collections" | "aging"): Promise<string>;
}

export interface SettingsApi {
  tenant(): Promise<TenantProfile>;
  updateTenant(body: UpdateTenantRequest): Promise<TenantProfile>;
  updateSettings(body: Partial<TenantSettings>): Promise<TenantProfile>;
  periodLock(date: string): Promise<TenantProfile>;
  checklist(): Promise<SetupChecklist>;
  subscription(): Promise<SubscriptionInfo>;
  recordManualPayment(): Promise<SubscriptionInfo>;
  resetDemo(): Promise<void>;
  importPreview(csv: string): Promise<ImportPreview>;
  importCommit(id: string): Promise<{ created: number }>;
  importErrorReport(id: string): Promise<string>;
}

export interface StaffApi {
  list(): Promise<Member[]>;
  invite(body: InviteMemberRequest): Promise<Member>;
  update(id: string, body: { role?: Role; isActive?: boolean }): Promise<Member>;
  remove(id: string): Promise<void>;
}

export interface StatementsApi {
  publicGet(token: string): Promise<PublicStatement>;
  optOut(token: string): Promise<void>;
}

export interface NotificationsApi {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface AuditApi {
  list(): Promise<AuditLog[]>;
}

export interface AdminApi {
  tenants(): Promise<AdminTenantSummary[]>;
  tenant(id: string): Promise<AdminTenantDetail>;
  createTenant(body: AdminTenantInput): Promise<AdminTenantDetail>;
  setStatus(id: string, status: SubscriptionStatus): Promise<AdminTenantDetail>;
  setSubscription(id: string, planId: string): Promise<AdminTenantDetail>;
  createInvoice(tenantId: string, body: { amount: string; note?: string }): Promise<AdminInvoice>;
  invoices(): Promise<AdminInvoice[]>;
  markInvoicePaid(id: string): Promise<AdminInvoice>;
  topUpWallet(tenantId: string, amount: string): Promise<{ balance: string }>;
  plans(): Promise<AdminPlan[]>;
  createPlan(body: AdminPlanInput): Promise<AdminPlan>;
  updatePlan(id: string, body: AdminPlanInput): Promise<AdminPlan>;
  deletePlan(id: string): Promise<void>;
  channelRates(): Promise<ChannelRate[]>;
  updateChannelRate(id: string, pricePerSegment: string): Promise<ChannelRate>;
  holidays(): Promise<Holiday[]>;
  createHoliday(body: HolidayInput): Promise<Holiday>;
  deleteHoliday(id: string): Promise<void>;
}

/** One module per resource. Screens depend on this interface, never on fetch. */
export interface ApiClient {
  auth: AuthApi;
  customers: CustomersApi;
  suppliers: SuppliersApi;
  ledger: LedgerApi;
  payments: PaymentsApi;
  collections: CollectionsApi;
  reminders: RemindersApi;
  reports: ReportsApi;
  settings: SettingsApi;
  staff: StaffApi;
  statements: StatementsApi;
  notifications: NotificationsApi;
  audit: AuditApi;
  admin: AdminApi;
}
