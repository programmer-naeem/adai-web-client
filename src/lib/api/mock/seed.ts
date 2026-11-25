import { DEMO_TODAY } from "@/lib/date";
import type { Role } from "@/lib/permissions";
import {
  emptyDatabase,
  evaluatePromises,
  postEntry,
  reverseEntry,
  uid,
  type Database,
  type DbGroup,
  type DbMembership,
  type DbParty,
  type DbPromise,
  type DbTenant,
  type DbTenantSettings,
  type DbUser,
  type EngineActor,
} from "@/lib/api/mock/engine";

export const IDS = {
  owner: "usr_owner",
  manager: "usr_manager",
  collector: "usr_collector",
  collector2: "usr_collector_2",
  superadmin: "usr_superadmin",
  tenant: "ten_bismillah",
  tenant2: "ten_rahim",
  groupMirpur: "grp_mirpur",
  groupDhanmondi: "grp_dhanmondi",
  groupWholesale: "grp_wholesale",
  karim: "cus_karim",
  nasrin: "cus_nasrin",
  tarik: "cus_tarik",
  rafiq: "cus_rafiq",
  salma: "cus_salma",
  habib: "cus_habib",
  mita: "cus_mita",
  jahir: "cus_jahir",
  kamal: "cus_kamal",
  farhana: "cus_farhana",
  shafiq: "cus_shafiq",
  nurul: "cus_nurul",
  anwar: "cus_anwar",
  rahman: "sup_rahman",
  karimSons: "sup_karim_sons",
  packaging: "sup_packaging",
  ikbal: "cus_ikbal",
  rina: "cus_rina",
  noor: "sup_noor",
  planStarter: "plan_starter",
  planBusiness: "plan_business",
  planPremium: "plan_premium",
  rateSms: "rate_sms",
  rateWhatsapp: "rate_whatsapp",
} as const;

export interface DbTemplate {
  id: string;
  tenantId: string | null;
  key: string;
  channel: "Sms" | "WhatsApp";
  language: "bn" | "en";
  name: string;
  description: string;
  body: string;
  whatsAppStatus: "APPROVED" | "PENDING" | "REJECTED" | "NONE";
}

export interface DbRule {
  id: string;
  tenantId: string;
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

export interface DbMessage {
  id: string;
  tenantId: string;
  partyId?: string;
  channel: "Sms" | "WhatsApp";
  language: "bn" | "en";
  templateId?: string;
  renderedBody: string;
  toPhoneE164: string;
  status: "Queued" | "Sending" | "Sent" | "Delivered" | "Read" | "Failed" | "Blocked" | "Cancelled";
  failureReason?: string;
  segments: number;
  costPaisa: number;
  triggerType: "Manual" | "Bulk" | "Rule" | "Transaction" | "System";
  batchId?: string;
  createdAtUtc: string;
  createdBy?: string;
  attempts: number;
}

export interface DbContact {
  id: string;
  tenantId: string;
  partyId: string;
  userId: string;
  channel: "Call" | "Visit" | "WhatsApp";
  outcome: "Promised" | "Paid" | "NotReachable" | "Disputed" | "Refused";
  note?: string;
  atUtc: string;
}

export interface DbPending {
  id: string;
  tenantId: string;
  partyId: string;
  collectorId: string;
  amountPaisa: number;
  method: "Cash" | "Bkash" | "Nagad" | "Rocket" | "Bank" | "Cheque" | "Card" | "Other";
  referenceNo?: string;
  note?: string;
  status: "Pending" | "Approved" | "Rejected";
  collectedAtUtc: string;
  rejectReason?: string;
  postedEntryId?: string;
}

export interface DbHandover {
  id: string;
  tenantId: string;
  collectorId: string;
  handoverDate: string;
  declaredPaisa: number;
  confirmedPaisa?: number;
  cashCollectedPaisa: number;
  status: "Submitted" | "Confirmed";
  note?: string;
}

export interface DbNotification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  href: string;
  entityType?: string;
  entityId?: string;
  readAtUtc?: string;
  createdAtUtc: string;
}

export interface DbAudit {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, string>;
  after?: Record<string, string>;
  atUtc: string;
}

export interface DbWallet {
  tenantId: string;
  balancePaisa: number;
  reservedPaisa: number;
  thresholdPaisa: number;
}

export interface DbWalletTx {
  id: string;
  tenantId: string;
  type: "TopUp" | "Capture" | "Release" | "Adjustment" | "PlanCredit";
  amountPaisa: number;
  balanceAfterPaisa: number;
  note: string;
  createdAtUtc: string;
}

export interface DbSession {
  id: string;
  userId: string;
  tenantId: string;
  refreshToken: string;
  deviceName: string;
  platform: string;
  createdAtUtc: string;
  lastSeenAtUtc: string;
  revokedAtUtc?: string;
}

export interface DbOtp {
  id: string;
  phoneE164: string;
  purpose: "signup" | "login" | "reset";
  code: string;
  expiresAt: number;
  attempts: number;
  consumed: boolean;
}

export interface DbTicket {
  id: string;
  phoneE164: string;
  purpose: "signup" | "reset";
  expiresAt: number;
  consumed: boolean;
}

export interface DbImport {
  id: string;
  tenantId: string;
  csv: string;
  errors: { row: number; field: string; code: string }[];
  validRows: Record<string, string>[];
  committed: boolean;
}

export interface DbStatementView {
  id: string;
  token: string;
  atUtc: string;
}

export interface DbPlan {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  monthlyPricePaisa: number;
  maxCustomers: number;
  includedCreditsPaisa: number;
  isActive: boolean;
}

export interface DbChannelRate {
  id: string;
  channel: "Sms" | "WhatsApp";
  pricePaisa: number;
}

export interface DbHoliday {
  id: string;
  date: string;
  name: string;
  nameBn: string;
}

export interface DbInvoice {
  id: string;
  tenantId: string;
  number: string;
  amountPaisa: number;
  status: "Open" | "Paid";
  issuedOn: string;
  paidOn?: string;
  note?: string;
}

export interface AppDatabase extends Database {
  templates: DbTemplate[];
  rules: DbRule[];
  messages: DbMessage[];
  contacts: DbContact[];
  pending: DbPending[];
  handovers: DbHandover[];
  notifications: DbNotification[];
  audit: DbAudit[];
  wallets: DbWallet[];
  walletTx: DbWalletTx[];
  sessions: DbSession[];
  otps: DbOtp[];
  tickets: DbTicket[];
  imports: DbImport[];
  statementViews: DbStatementView[];
  plans: DbPlan[];
  channelRates: DbChannelRate[];
  holidays: DbHoliday[];
  invoices: DbInvoice[];
}

export function defaultSettings(overrides: Partial<DbTenantSettings> = {}): DbTenantSettings {
  return {
    defaultCreditDays: 7,
    backdateLimitDays: 90,
    sendWindowStart: "10:00",
    sendWindowEnd: "20:00",
    sendDays: "all",
    digestTime: "21:00",
    requireCollectionApproval: false,
    collectorCanSeeAll: false,
    collectorCanRecordCredit: false,
    staffReverseWindowMinutes: 30,
    minReminderBalancePaisa: 10_000,
    maxRemindersPerCustomerPerDay: 1,
    fallbackToSms: true,
    receiptsIgnoreOptOut: false,
    enforceCreditLimit: false,
    defaultLanguage: "bn",
    skipFridayJummah: true,
    notifyOnEntry: true,
    ...overrides,
  };
}

const DEMO_PASSWORD = "aadai123";

function user(id: string, phone: string, fullName: string, language: "bn" | "en" = "bn", platformRole?: DbUser["platformRole"]): DbUser {
  return { id, phoneE164: phone, fullName, password: DEMO_PASSWORD, preferredLanguage: language, status: "Active", platformRole };
}

function member(tenantId: string, userId: string, role: Role, subtitle: string, isActive = true): DbMembership {
  return { id: uid(), tenantId, userId, role, isActive, subtitle };
}

function party(input: Omit<DbParty, "currentBalancePaisa" | "isArchived" | "isDeleted" | "rowVersion" | "createdAtUtc" | "doNotRemind" | "smsConsent" | "whatsAppConsent" | "creditLimitPaisa" | "preferredLanguage" | "preferredChannel"> & Partial<DbParty>): DbParty {
  return {
    currentBalancePaisa: 0,
    isArchived: false,
    isDeleted: false,
    rowVersion: 1,
    createdAtUtc: "2026-10-01T06:00:00.000Z",
    doNotRemind: false,
    smsConsent: "OptedIn",
    whatsAppConsent: "OptedIn",
    creditLimitPaisa: 0,
    preferredLanguage: "bn",
    preferredChannel: "WhatsApp",
    ...input,
    area: input.area ?? "",
  };
}

const TEMPLATES: Omit<DbTemplate, "id" | "tenantId" | "channel" | "whatsAppStatus">[] = [
  {
    key: "CreditSaleNotice",
    language: "bn",
    name: "বাকি যোগ",
    description: "নতুন বাকি যোগ হলে",
    body: "{{business_name}}: আপনার নামে ৳{{amount}} বাকি যোগ হয়েছে। মোট বাকি ৳{{balance}}। পরিশোধের তারিখ {{due_date}}। বিস্তারিত: {{statement_link}}",
  },
  {
    key: "CreditSaleNotice",
    language: "en",
    name: "Credit added",
    description: "When a new due is added",
    body: "{{business_name}}: ৳{{amount}} added to your account. Total due ৳{{balance}}, due by {{due_date}}. Details: {{statement_link}}",
  },
  {
    key: "Receipt",
    language: "bn",
    name: "রসিদ",
    description: "জমা পেলে",
    body: "{{business_name}}: ৳{{amount}} জমা পেয়েছি, ধন্যবাদ! রসিদ {{receipt_no}}। বর্তমান বাকি ৳{{balance}}।",
  },
  {
    key: "Receipt",
    language: "en",
    name: "Receipt",
    description: "When a payment is received",
    body: "{{business_name}}: Received ৳{{amount}}, thank you! Receipt {{receipt_no}}. Current balance ৳{{balance}}.",
  },
  {
    key: "ReminderDue",
    language: "bn",
    name: "সাধারণ তাগাদা",
    description: "মেয়াদের দিনে ও আগে পাঠানোর জন্য",
    body: "প্রিয় {{customer_name}}, {{business_name}}-এ আপনার ৳{{overdue_amount}} পরিশোধের তারিখ আজ। মোট বাকি ৳{{balance}}। হিসাব দেখুন: {{statement_link}}",
  },
  {
    key: "ReminderDue",
    language: "en",
    name: "Polite Reminder",
    description: "For corporate or English-speaking customers",
    body: "Dear {{customer_name}}, ৳{{overdue_amount}} is due today at {{business_name}}. Total balance ৳{{balance}}. View: {{statement_link}}",
  },
  {
    key: "ReminderOverdue",
    language: "bn",
    name: "জরুরি মেয়াদোত্তীর্ণ",
    description: "৩ দিন বা তার বেশি বাকি থাকলে",
    body: "প্রিয় {{customer_name}}, {{business_name}}-এ আপনার ৳{{overdue_amount}} বকেয়া রয়েছে। সুবিধামতো দ্রুত পরিশোধের অনুরোধ রইলো। হিসাব: {{statement_link}} যোগাযোগ: {{business_phone}}",
  },
  {
    key: "ReminderOverdue",
    language: "en",
    name: "Overdue reminder",
    description: "When a due is overdue",
    body: "Dear {{customer_name}}, ৳{{overdue_amount}} is overdue at {{business_name}}. Kindly pay at your earliest convenience. Statement: {{statement_link}} Call: {{business_phone}}",
  },
  {
    key: "ReminderEscalation",
    language: "bn",
    name: "কঠোর তাগাদা",
    description: "৬০ দিনের বেশি বকেয়া",
    body: "{{customer_name}}, আপনার ৳{{overdue_amount}} বকেয়া ৬০ দিনের বেশি সময় ধরে অপরিশোধিত। অনুগ্রহ করে {{business_phone}} নম্বরে যোগাযোগ করে পরিশোধের তারিখ জানান। — {{business_name}}",
  },
  {
    key: "ReminderEscalation",
    language: "en",
    name: "Escalation",
    description: "Over 60 days overdue",
    body: "{{customer_name}}, ৳{{overdue_amount}} has been overdue for over 60 days. Please call {{business_phone}} to arrange payment. — {{business_name}}",
  },
  {
    key: "PtpReminder",
    language: "bn",
    name: "প্রতিশ্রুতি মনে করানো",
    description: "প্রতিশ্রুতির দিনে",
    body: "প্রিয় {{customer_name}}, আজ ({{promise_date}}) ৳{{promise_amount}} পরিশোধের কথা ছিল। ধন্যবাদ — {{business_name}}",
  },
  {
    key: "PtpReminder",
    language: "en",
    name: "Promise reminder",
    description: "On the promise date",
    body: "Dear {{customer_name}}, as agreed, ৳{{promise_amount}} is to be paid today ({{promise_date}}). Thank you — {{business_name}}",
  },
  {
    key: "MonthlyStatement",
    language: "bn",
    name: "মাসিক স্টেটমেন্ট",
    description: "মাসের শুরুতে",
    body: "{{business_name}}: {{customer_name}}, এই মাসের শুরুতে আপনার মোট বাকি ৳{{balance}}। বিস্তারিত হিসাব: {{statement_link}}",
  },
  {
    key: "MonthlyStatement",
    language: "en",
    name: "Monthly statement",
    description: "Start of the month",
    body: "{{business_name}}: {{customer_name}}, your balance as of this month is ৳{{balance}}. Full statement: {{statement_link}}",
  },
];

function rulesFor(tenantId: string): DbRule[] {
  const rows: Omit<DbRule, "id" | "tenantId">[] = [
    { code: "R1", name: "মেয়াদের আগে", description: "কাস্টমারকে আগাম মনে করিয়ে দেবে", isEnabled: false, triggerType: "BeforeDue", offsetDays: -2, maxAttempts: 1, channel: "Preferred", templateKey: "ReminderDue" },
    { code: "R2", name: "মেয়াদের দিনে", description: "নির্ধারিত তারিখে তাগাদা পাঠাবে", isEnabled: true, triggerType: "OnDue", offsetDays: 0, maxAttempts: 1, channel: "Preferred", templateKey: "ReminderDue" },
    { code: "R3", name: "মেয়াদের পরে", description: "মেয়াদোত্তীর্ণ হলে জরুরি তাগাদা পাঠাবে", isEnabled: true, triggerType: "AfterDue", offsetDays: 3, repeatEveryDays: 7, maxAttempts: 4, channel: "Preferred", templateKey: "ReminderOverdue" },
    { code: "R4", name: "কঠোর তাগাদা", description: "৬০ দিন পর মাসে একবার", isEnabled: false, triggerType: "Escalation", offsetDays: 60, repeatEveryDays: 30, maxAttempts: 3, channel: "Preferred", templateKey: "ReminderEscalation" },
    { code: "R5", name: "প্রতিশ্রুতির দিন", description: "প্রতিশ্রুতির সকালে মনে করিয়ে দেবে", isEnabled: true, triggerType: "Ptp", offsetDays: 0, maxAttempts: 1, channel: "Preferred", templateKey: "PtpReminder" },
    { code: "R6", name: "মাসিক স্টেটমেন্ট", description: "মাসের ১ তারিখে বাকি থাকলে", isEnabled: false, triggerType: "MonthlyStatement", offsetDays: 1, maxAttempts: 1, channel: "Preferred", templateKey: "MonthlyStatement" },
  ];
  return rows.map((row) => ({ ...row, id: uid(), tenantId }));
}

export function seedDatabase(): AppDatabase {
  const db: AppDatabase = {
    ...emptyDatabase(),
    templates: [],
    rules: [],
    messages: [],
    contacts: [],
    pending: [],
    handovers: [],
    notifications: [],
    audit: [],
    wallets: [],
    walletTx: [],
    sessions: [],
    otps: [],
    tickets: [],
    imports: [],
    statementViews: [],
    plans: [],
    channelRates: [],
    holidays: [],
    invoices: [],
  };

  db.users.push(
    user(IDS.owner, "+8801711345678", "হাজী আব্দুর রহিম"),
    user(IDS.manager, "+8801812456789", "তানভীর আহমেদ"),
    user(IDS.collector, "+8801913567890", "মোঃ সোহেল রানা"),
    user(IDS.collector2, "+8801614678901", "মোঃ জুয়েল মিয়া"),
    user(IDS.superadmin, "+8801611223344", "প্ল্যাটফর্ম অ্যাডমিন", "bn", "SuperAdmin"),
  );

  db.plans.push(
    { id: IDS.planStarter, code: "Starter", name: "Starter", nameBn: "স্টার্টার", monthlyPricePaisa: 79_900, maxCustomers: 500, includedCreditsPaisa: 10_000, isActive: true },
    { id: IDS.planBusiness, code: "Business", name: "Business", nameBn: "বিজনেস", monthlyPricePaisa: 199_900, maxCustomers: 3_000, includedCreditsPaisa: 30_000, isActive: true },
    { id: IDS.planPremium, code: "Premium", name: "Premium", nameBn: "প্রিমিয়াম", monthlyPricePaisa: 499_900, maxCustomers: 100_000, includedCreditsPaisa: 70_000, isActive: true },
  );
  db.channelRates.push(
    { id: IDS.rateSms, channel: "Sms", pricePaisa: 50 },
    { id: IDS.rateWhatsapp, channel: "WhatsApp", pricePaisa: 80 },
  );
  const holidayRows: [string, string, string][] = [
    ["2026-02-04", "Shab-e-Barat", "শব-ই-বরাত"],
    ["2026-02-21", "Shaheed Day and International Mother Language Day", "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস"],
    ["2026-03-17", "Shab-e-Qadr", "শব-ই-কদর"],
    ["2026-03-19", "Eid-ul-Fitr", "ঈদুল ফিতর"],
    ["2026-03-20", "Eid-ul-Fitr", "ঈদুল ফিতর"],
    ["2026-03-21", "Eid-ul-Fitr", "ঈদুল ফিতর"],
    ["2026-03-22", "Eid-ul-Fitr", "ঈদুল ফিতর"],
    ["2026-03-23", "Eid-ul-Fitr", "ঈদুল ফিতর"],
    ["2026-03-26", "Independence and National Day", "স্বাধীনতা ও জাতীয় দিবস"],
    ["2026-04-14", "Bengali New Year", "পহেলা বৈশাখ"],
    ["2026-05-01", "May Day", "মে দিবস"],
    ["2026-05-26", "Eid-ul-Azha", "ঈদুল আজহা"],
    ["2026-05-27", "Eid-ul-Azha", "ঈদুল আজহা"],
    ["2026-05-28", "Eid-ul-Azha", "ঈদুল আজহা"],
    ["2026-05-29", "Eid-ul-Azha", "ঈদুল আজহা"],
    ["2026-05-30", "Eid-ul-Azha", "ঈদুল আজহা"],
    ["2026-05-31", "Eid-ul-Azha", "ঈদুল আজহা"],
    ["2026-06-26", "Ashura", "আশুরা"],
    ["2026-08-05", "July Mass Uprising Day", "জুলাই গণ-অভ্যুত্থান দিবস"],
    ["2026-08-26", "Eid-e-Milad-un-Nabi", "ঈদে মিলাদুন্নবী"],
    ["2026-09-04", "Janmashtami", "জন্মাষ্টমী"],
    ["2026-10-20", "Durga Puja", "দুর্গাপূজা"],
    ["2026-10-21", "Durga Puja", "দুর্গাপূজা"],
    ["2026-12-16", "Victory Day", "বিজয় দিবস"],
    ["2026-12-25", "Christmas Day", "বড়দিন"],
  ];
  db.holidays.push(...holidayRows.map(([date, name, nameBn]) => ({ id: uid(), date, name, nameBn })));

  const tenant: DbTenant = {
    id: IDS.tenant,
    name: "Bismillah Traders",
    nameBn: "বিসমিল্লাহ ট্রেডার্স",
    businessType: "হার্ডওয়্যার ও মুদি",
    phoneE164: "+8801711345678",
    address: "চকবাজার, ঢাকা",
    logoText: "বি",
    status: "Trial",
    trialEndsOn: "2026-11-27",
    planId: IDS.planBusiness,
    planName: "Business",
    maxCustomers: 3_000,
    settings: defaultSettings(),
  };
  const tenant2: DbTenant = {
    id: IDS.tenant2,
    name: "Rahim Electronics",
    nameBn: "রহিম ইলেকট্রনিক্স",
    businessType: "ইলেকট্রনিক্স",
    phoneE164: "+8801711345678",
    address: "মিরপুর ১, ঢাকা",
    logoText: "র",
    status: "Active",
    planId: IDS.planStarter,
    planName: "Starter",
    maxCustomers: 500,
    settings: defaultSettings({ defaultCreditDays: 15 }),
  };
  db.tenants.push(tenant, tenant2);

  db.memberships.push(
    member(IDS.tenant, IDS.owner, "Owner", "প্রধান অ্যাকাউন্ট"),
    member(IDS.tenant, IDS.manager, "Manager", "দোকান পরিচালনা"),
    member(IDS.tenant, IDS.collector, "Collector", "মাঠ পর্যায়ের আদায়"),
    member(IDS.tenant, IDS.collector2, "Collector", "মাঠ পর্যায়ের আদায়", false),
    member(IDS.tenant2, IDS.owner, "Owner", "প্রধান অ্যাকাউন্ট"),
    member(IDS.tenant, IDS.superadmin, "Viewer", "প্ল্যাটফর্ম"),
  );

  const groups: DbGroup[] = [
    { id: IDS.groupMirpur, tenantId: IDS.tenant, name: "মিরপুর খুচরা", color: "#0F766E" },
    { id: IDS.groupDhanmondi, tenantId: IDS.tenant, name: "ধানমন্ডি", color: "#D97706" },
    { id: IDS.groupWholesale, tenantId: IDS.tenant, name: "পাইকারি", color: "#466460" },
  ];
  db.groups.push(...groups);

  const customers: DbParty[] = [
    party({ id: IDS.karim, tenantId: IDS.tenant, partyType: "Customer", code: "C-001", name: "করিম হার্ডওয়্যার", nameEn: "Karim Hardware", phoneE164: "+8801711234567", area: "মিরপুর ১০", address: "মিরপুর ১০, ঢাকা", groupId: IDS.groupMirpur, creditDays: 7, creditLimitPaisa: 2_000_000, assignedCollectorId: IDS.collector, statementToken: "karim-842", statementExpiresOn: "2026-12-22" }),
    party({ id: IDS.nasrin, tenantId: IDS.tenant, partyType: "Customer", code: "C-002", name: "নাসরিন বুটিক", nameEn: "Nasrin Boutique", phoneE164: "+8801812345678", area: "ধানমন্ডি", groupId: IDS.groupDhanmondi, creditDays: 7, assignedCollectorId: IDS.collector }),
    party({ id: IDS.tarik, tenantId: IDS.tenant, partyType: "Customer", code: "C-003", name: "তারিক স্টোর", nameEn: "Tarik Store", phoneE164: "+8801913456789", area: "উত্তরা", creditDays: 7, assignedCollectorId: IDS.collector }),
    party({ id: IDS.rafiq, tenantId: IDS.tenant, partyType: "Customer", code: "C-004", name: "রফিক স্যানিটারি", nameEn: "Rafiq Sanitary", phoneE164: "+8801715567890", area: "যাত্রাবাড়ী", creditDays: 7, assignedCollectorId: IDS.collector }),
    party({ id: IDS.salma, tenantId: IDS.tenant, partyType: "Customer", code: "C-005", name: "সালমা জেনারেল", nameEn: "Salma General", phoneE164: "+8801618678901", area: "মোহাম্মদপুর", creditDays: 0, smsConsent: "OptedOut" }),
    party({ id: IDS.habib, tenantId: IDS.tenant, partyType: "Customer", code: "C-006", name: "হাবিব ইলেকট্রনিক্স", nameEn: "Habib Electronics", phoneE164: "+8801511222333", area: "মিরপুর ১", groupId: IDS.groupMirpur, creditDays: 15, assignedCollectorId: IDS.collector2 }),
    party({ id: IDS.mita, tenantId: IDS.tenant, partyType: "Customer", code: "C-007", name: "মিতা ফ্যাশন হাউজ", nameEn: "Mita Fashion House", phoneE164: "+8801312333444", area: "ধানমন্ডি", groupId: IDS.groupDhanmondi, creditDays: 7, assignedCollectorId: IDS.collector2 }),
    party({ id: IDS.jahir, tenantId: IDS.tenant, partyType: "Customer", code: "C-008", name: "জহির ট্রেডার্স", nameEn: "Jahir Traders", phoneE164: "+8801414555666", area: "উত্তরা", groupId: IDS.groupWholesale, creditDays: 30, assignedCollectorId: IDS.collector2 }),
    party({ id: IDS.kamal, tenantId: IDS.tenant, partyType: "Customer", code: "C-009", name: "কামাল গার্মেন্টস", nameEn: "Kamal Garments", phoneE164: "+8801716777888", area: "যাত্রাবাড়ী", creditDays: 7, assignedCollectorId: IDS.collector }),
    party({ id: IDS.farhana, tenantId: IDS.tenant, partyType: "Customer", code: "C-010", name: "ফারহানা কসমেটিক্স", nameEn: "Farhana Cosmetics", phoneE164: "+8801819888999", area: "মোহাম্মদপুর", creditDays: 10, assignedCollectorId: IDS.collector, preferredLanguage: "en", statementToken: "farhana-en", statementExpiresOn: "2026-12-22" }),
    party({ id: IDS.shafiq, tenantId: IDS.tenant, partyType: "Customer", code: "C-011", name: "শফিক বিল্ডিং", nameEn: "Shafiq Building", phoneE164: "+8801917666555", area: "চকবাজার", groupId: IDS.groupWholesale, creditDays: 20 }),
    party({ id: IDS.nurul, tenantId: IDS.tenant, partyType: "Customer", code: "C-012", name: "নুরুল ইসলাম", nameEn: "Nurul Islam", phoneE164: "+8801613444555", area: "বনানী", creditDays: 15 }),
    party({ id: IDS.anwar, tenantId: IDS.tenant, partyType: "Customer", code: "C-013", name: "আনোয়ার রাইস এজেন্সি", nameEn: "Anwar Rice Agency", phoneE164: "+8801718999000", area: "চকবাজার", groupId: IDS.groupWholesale, creditDays: 7 }),
    party({ id: IDS.rahman, tenantId: IDS.tenant, partyType: "Supplier", code: "S-001", name: "রহমান স্টিল মিলস", nameEn: "Rahman Steel Mills", phoneE164: "+8801710001111", area: "পোস্তা", creditDays: 15, preferredChannel: "None" }),
    party({ id: IDS.karimSons, tenantId: IDS.tenant, partyType: "Supplier", code: "S-002", name: "মেসার্স করিম অ্যান্ড সন্স", nameEn: "M/s Karim & Sons", phoneE164: "+8801810002222", area: "চকবাজার", creditDays: 7, preferredChannel: "None" }),
    party({ id: IDS.packaging, tenantId: IDS.tenant, partyType: "Supplier", code: "S-003", name: "ঢাকা প্যাকেজিং", nameEn: "Dhaka Packaging", phoneE164: "+8801910003333", area: "নারায়ণগঞ্জ", creditDays: 0, preferredChannel: "None" }),
    party({ id: IDS.ikbal, tenantId: IDS.tenant2, partyType: "Customer", code: "C-001", name: "ইকবাল মোবাইল", nameEn: "Iqbal Mobile", phoneE164: "+8801711000001", area: "মিরপুর ১", creditDays: 15 }),
    party({ id: IDS.rina, tenantId: IDS.tenant2, partyType: "Customer", code: "C-002", name: "রিনা টেলিকম", nameEn: "Rina Telecom", phoneE164: "+8801811000002", area: "মিরপুর ১", creditDays: 15 }),
    party({ id: IDS.noor, tenantId: IDS.tenant2, partyType: "Supplier", code: "S-001", name: "মেসার্স নূর", nameEn: "M/s Noor", phoneE164: "+8801911000003", area: "মিরপুর", creditDays: 0, preferredChannel: "None" }),
  ];
  db.parties.push(...customers);

  const actor = (tenantId: string, userId: string = IDS.owner, role: EngineActor["role"] = "Owner"): EngineActor => ({
    userId,
    role,
    tenantId,
    today: DEMO_TODAY,
    skipPolicy: true,
  });

  const sale = (tenantId: string, partyId: string, amount: string, entryDate: string, dueDate: string, note: string) =>
    postEntry(db, actor(tenantId), { partyId, entryType: "CreditSale", amount, entryDate, dueDate, note });
  const pay = (tenantId: string, partyId: string, amount: string, entryDate: string, note = "নগদ টাকা আদায়") =>
    postEntry(db, actor(tenantId), { partyId, entryType: "PaymentReceived", amount, entryDate, method: "Cash", note });
  const purchase = (tenantId: string, partyId: string, amount: string, entryDate: string, dueDate: string, note: string) =>
    postEntry(db, actor(tenantId), { partyId, entryType: "CreditPurchase", amount, entryDate, dueDate, note });
  const paySupplier = (tenantId: string, partyId: string, amount: string, entryDate: string) =>
    postEntry(db, actor(tenantId), { partyId, entryType: "PaymentMade", amount, entryDate, method: "Cash", note: "পরিশোধ" });

  const t = IDS.tenant;
  const received = (
    userId: string,
    role: EngineActor["role"],
    partyId: string,
    amount: string,
    entryDate: string,
    method: "Cash" | "Bkash" | "Nagad" | "Rocket",
    note: string,
    referenceNo?: string,
  ) =>
    postEntry(db, actor(t, userId, role), {
      partyId,
      entryType: "PaymentReceived",
      amount,
      entryDate,
      method,
      note,
      referenceNo,
    });
  const discount = (partyId: string, amount: string, entryDate: string, note: string) =>
    postEntry(db, actor(t, IDS.manager, "Manager"), { partyId, entryType: "Discount", amount, entryDate, note });

  sale(t, IDS.karim, "25000.00", "2026-09-02", "2026-09-09", "সিমেন্ট ৫০ বস্তা, চালান ১৪২");
  received(IDS.collector, "Collector", IDS.karim, "15000.00", "2026-09-08", "Cash", "নগদ — দোকানে এসে দিয়েছে");
  received(IDS.manager, "Manager", IDS.karim, "10000.00", "2026-09-12", "Bkash", "bKash জমা, 01711-234567", "8H21K9P3");
  sale(t, IDS.karim, "6000.00", "2026-09-20", "2026-09-27", "ফিটিংস ও সকেট");
  discount(IDS.karim, "500.00", "2026-09-28", "পাকা কাস্টমার ছাড়");
  received(IDS.owner, "Owner", IDS.karim, "5500.00", "2026-10-02", "Nagad", "নগদ অ্যাপ থেকে জমা", "NG441290");
  sale(t, IDS.karim, "15000.00", "2026-11-02", "2026-11-15", "পাইপ ও ফিটিংস (বাকি)");
  pay(t, IDS.karim, "4000.00", "2026-11-08", "নগদ টাকা আদায়");
  sale(t, IDS.karim, "8500.00", "2026-11-15", "2026-11-15", "রড ও সিমেন্ট (বাকি)");
  pay(t, IDS.karim, "5000.00", "2026-11-20", "নগদ টাকা আদায়");
  const karimMistake = sale(t, IDS.karim, "3200.00", "2026-11-21", "2026-11-28", "ভুল এন্ট্রি — রফিক স্যানিটারির মাল");
  reverseEntry(db, actor(t, IDS.manager, "Manager"), karimMistake.entry.id, "ভুল কাস্টমারে লেখা হয়েছিল");

  sale(t, IDS.nasrin, "7500.00", "2026-10-06", "2026-10-13", "জামদানি শাড়ি, লট ৩");
  received(IDS.collector, "Collector", IDS.nasrin, "5000.00", "2026-10-14", "Bkash", "bKash জমা", "BK44N218");
  discount(IDS.nasrin, "500.00", "2026-10-22", "উৎসব ছাড়");
  pay(t, IDS.nasrin, "2000.00", "2026-10-28", "দোকানে নগদ");
  sale(t, IDS.nasrin, "12000.00", "2026-11-05", "2026-11-19", "শাড়ি লট (বাকি)");
  pay(t, IDS.nasrin, "3800.00", "2026-11-12");

  sale(t, IDS.tarik, "3000.00", "2026-10-18", "2026-10-25", "সয়াবিন তেল ও সাবান");
  received(IDS.collector, "Collector", IDS.tarik, "3000.00", "2026-10-25", "Rocket", "রকেট থেকে জমা", "RK778120");
  sale(t, IDS.tarik, "9600.00", "2026-11-10", "2026-11-22", "মুদি মাল (বাকি)");
  pay(t, IDS.tarik, "4000.00", "2026-11-22");

  sale(t, IDS.rafiq, "8000.00", "2026-11-01", "2026-11-10", "স্যানিটারি মাল (বাকি)");
  pay(t, IDS.rafiq, "11000.00", "2026-11-18");

  sale(t, IDS.salma, "2500.00", "2026-11-03", "2026-11-10", "খুচরা মাল");
  pay(t, IDS.salma, "2500.00", "2026-11-10");
  for (const [date, amount] of [
    ["2026-11-16", "12000.00"],
    ["2026-11-17", "16000.00"],
    ["2026-11-19", "9800.00"],
    ["2026-11-20", "16000.00"],
    ["2026-11-21", "15000.00"],
  ] as const) {
    sale(t, IDS.salma, amount, date, date, "নগদ বিক্রি");
    pay(t, IDS.salma, amount, date, "নগদ জমা");
  }

  sale(t, IDS.habib, "40000.00", "2026-09-20", "2026-10-01", "ইলেকট্রনিক্স লট");
  pay(t, IDS.habib, "8000.00", "2026-10-15");
  const habibMistake = sale(t, IDS.habib, "1500.00", "2026-11-18", "2026-11-25", "ভুল এন্ট্রি — অন্য দোকানের কেবল");
  reverseEntry(db, actor(t, IDS.owner, "Owner"), habibMistake.entry.id, "ভুল অঙ্ক, বাতিল করা হলো");
  pay(t, IDS.habib, "3500.00", "2026-11-22");

  sale(t, IDS.mita, "25000.00", "2026-09-01", "2026-09-10", "পোশাক লট");
  pay(t, IDS.mita, "6400.00", "2026-10-20");

  sale(t, IDS.jahir, "20000.00", "2026-07-15", "2026-07-20", "পাইকারি মাল");
  pay(t, IDS.jahir, "7600.00", "2026-09-01");

  sale(t, IDS.kamal, "20000.00", "2026-11-01", "2026-11-08", "গার্মেন্টস");
  pay(t, IDS.kamal, "4800.00", "2026-11-18");

  sale(t, IDS.farhana, "14000.00", "2026-11-08", "2026-11-18", "কসমেটিক্স");
  pay(t, IDS.farhana, "4200.00", "2026-11-19");

  sale(t, IDS.shafiq, "30000.00", "2026-11-15", "2026-12-05", "সিমেন্ট");
  pay(t, IDS.shafiq, "8000.00", "2026-11-22");

  sale(t, IDS.nurul, "9650.00", "2026-11-12", "2026-12-01", "বিবিধ");
  pay(t, IDS.nurul, "3250.00", "2026-11-22");

  sale(t, IDS.anwar, "11000.00", "2026-10-25", "2026-11-01", "চাল");
  pay(t, IDS.anwar, "3700.00", "2026-11-14");

  purchase(t, IDS.rahman, "25000.00", "2026-10-05", "2026-10-20", "স্টিল");
  paySupplier(t, IDS.rahman, "6600.00", "2026-11-02");
  purchase(t, IDS.karimSons, "15000.00", "2026-10-12", "2026-10-19", "মালামাল");
  paySupplier(t, IDS.karimSons, "6000.00", "2026-11-05");
  purchase(t, IDS.packaging, "5000.00", "2026-11-01", "2026-11-01", "প্যাকেট");

  sale(IDS.tenant2, IDS.ikbal, "4500.00", "2026-11-18", "2026-12-03", "মোবাইল যন্ত্রাংশ");
  sale(IDS.tenant2, IDS.rina, "1200.00", "2026-11-20", "2026-12-05", "সিম ও চার্জার");
  purchase(IDS.tenant2, IDS.noor, "2000.00", "2026-11-10", "2026-11-10", "কেসিং");

  const promises: DbPromise[] = [
    { id: uid(), tenantId: t, partyId: IDS.karim, amountPaisa: 1_000_000, amountPaidPaisa: 0, promiseDate: "2026-11-25", status: "Open", note: "দোকানে এসে দিবে", channel: "call", createdBy: IDS.owner, createdOn: "2026-11-21", createdAtUtc: "2026-11-21T08:00:00.000Z" },
    { id: uid(), tenantId: t, partyId: IDS.nasrin, amountPaisa: 500_000, amountPaidPaisa: 0, promiseDate: "2026-11-20", status: "Open", note: "ঈদের পর", channel: "WhatsApp", createdBy: IDS.manager, createdOn: "2026-11-18", createdAtUtc: "2026-11-18T08:00:00.000Z" },
    { id: uid(), tenantId: t, partyId: IDS.tarik, amountPaisa: 400_000, amountPaidPaisa: 0, promiseDate: "2026-11-22", status: "Open", note: "আজ নগদ", channel: "visit", createdBy: IDS.collector, createdOn: "2026-11-21", createdAtUtc: "2026-11-21T09:00:00.000Z" },
    { id: uid(), tenantId: t, partyId: IDS.anwar, amountPaisa: 500_000, amountPaidPaisa: 0, promiseDate: "2026-11-24", status: "Open", note: "হাটে বিক্রির পর", channel: "call", createdBy: IDS.owner, createdOn: "2026-11-20", createdAtUtc: "2026-11-20T10:00:00.000Z" },
  ];
  db.promises.push(...promises);
  for (const id of [IDS.karim, IDS.nasrin, IDS.tarik, IDS.anwar]) evaluatePromises(db, id, DEMO_TODAY);

  for (const template of TEMPLATES) {
    for (const channel of ["Sms", "WhatsApp"] as const) {
      db.templates.push({
        ...template,
        id: uid(),
        tenantId: null,
        channel,
        whatsAppStatus: channel === "WhatsApp" ? "APPROVED" : "NONE",
      });
    }
  }
  db.rules.push(...rulesFor(IDS.tenant), ...rulesFor(IDS.tenant2));

  db.messages.push({
    id: uid(),
    tenantId: t,
    partyId: IDS.karim,
    channel: "WhatsApp",
    language: "bn",
    renderedBody: "প্রিয় করিম হার্ডওয়্যার, বিসমিল্লাহ ট্রেডার্স-এ আপনার ৳১৪,৫০০ বকেয়া রয়েছে।",
    toPhoneE164: "+8801711234567",
    status: "Delivered",
    segments: 1,
    costPaisa: 80,
    triggerType: "Rule",
    createdAtUtc: "2026-11-21T04:30:00.000Z",
    attempts: 1,
  });
  db.messages.push({
    id: uid(),
    tenantId: t,
    partyId: IDS.nasrin,
    channel: "Sms",
    language: "bn",
    renderedBody: "প্রিয় নাসরিন বুটিক, বিসমিল্লাহ ট্রেডার্স-এ আপনার বকেয়া রয়েছে।",
    toPhoneE164: "+8801812345678",
    status: "Failed",
    failureReason: "GATEWAY_TIMEOUT",
    segments: 1,
    costPaisa: 0,
    triggerType: "Manual",
    createdAtUtc: "2026-11-20T05:00:00.000Z",
    attempts: 1,
  });

  db.wallets.push(
    { tenantId: IDS.tenant, balancePaisa: 15_000, reservedPaisa: 0, thresholdPaisa: 20_000 },
    { tenantId: IDS.tenant2, balancePaisa: 50_000, reservedPaisa: 0, thresholdPaisa: 20_000 },
  );
  db.walletTx.push({
    id: uid(),
    tenantId: IDS.tenant,
    type: "PlanCredit",
    amountPaisa: 15_000,
    balanceAfterPaisa: 15_000,
    note: "ট্রায়াল ক্রেডিট",
    createdAtUtc: "2026-11-01T00:00:00.000Z",
  });

  db.invoices.push(
    {
      id: "inv_bismillah_open",
      tenantId: IDS.tenant,
      number: "INV-2026-001",
      amountPaisa: 199_900,
      status: "Open",
      issuedOn: "2026-11-01",
      note: "বিজনেস প্ল্যান, নভেম্বর",
    },
    {
      id: "inv_rahim_paid",
      tenantId: IDS.tenant2,
      number: "INV-2026-014",
      amountPaisa: 79_900,
      status: "Paid",
      issuedOn: "2026-11-01",
      paidOn: "2026-11-05",
      note: "স্টার্টার প্ল্যান, নভেম্বর",
    },
  );

  db.notifications.push(
    {
      id: uid(),
      tenantId: t,
      userId: IDS.owner,
      type: "wallet.low",
      titleBn: "মেসেজ ব্যালেন্স কম",
      titleEn: "Message balance is low",
      bodyBn: "ওয়ালেটে ৳১৫০ আছে, সীমা ৳২০০।",
      bodyEn: "Wallet has ৳150, below the ৳200 threshold.",
      href: "/wallet",
      createdAtUtc: "2026-11-22T02:00:00.000Z",
    },
    {
      id: uid(),
      tenantId: t,
      userId: IDS.owner,
      type: "ptp.today",
      titleBn: "আজকের প্রতিশ্রুতি",
      titleEn: "Promise due today",
      bodyBn: "তারিক স্টোর আজ ৳৪,০০০ দেবে বলেছে।",
      bodyEn: "Tarik Store promised ৳4,000 today.",
      href: "/collections",
      createdAtUtc: "2026-11-22T01:00:00.000Z",
    },
    {
      id: uid(),
      tenantId: t,
      userId: IDS.owner,
      type: "subscription.expiring",
      titleBn: "ট্রায়াল শেষ হতে ৫ দিন",
      titleEn: "Trial ends in 5 days",
      bodyBn: "২৭ নভেম্বরের মধ্যে প্ল্যান নবায়ন করুন।",
      bodyEn: "Renew the plan by 27 November.",
      href: "/plan",
      createdAtUtc: "2026-11-22T00:30:00.000Z",
      readAtUtc: "2026-11-22T05:00:00.000Z",
    },
    {
      id: uid(),
      tenantId: t,
      userId: IDS.owner,
      type: "party.overdue",
      titleBn: "করিম হার্ডওয়্যারের বাকি",
      titleEn: "Karim Hardware is overdue",
      bodyBn: "মোট বাকি দেখে তাগাদা দিন।",
      bodyEn: "Open the customer and send a reminder.",
      href: `/customers/${IDS.karim}`,
      entityType: "Customer",
      entityId: IDS.karim,
      createdAtUtc: "2026-11-22T03:10:00.000Z",
    },
  );

  db.audit.push({
    id: uid(),
    tenantId: t,
    userId: IDS.owner,
    action: "customer.create",
    entityType: "Party",
    entityId: IDS.karim,
    after: { name: "করিম হার্ডওয়্যার", phone: "+8801711234567" },
    atUtc: "2026-10-01T06:00:00.000Z",
  });

  db.contacts.push({
    id: uid(),
    tenantId: t,
    partyId: IDS.nasrin,
    userId: IDS.manager,
    channel: "Call",
    outcome: "Promised",
    note: "২০ নভেম্বরের মধ্যে দেবে",
    atUtc: "2026-11-18T09:30:00.000Z",
  });

  db.handovers.push({
    id: uid(),
    tenantId: t,
    collectorId: IDS.collector,
    handoverDate: "2026-11-21",
    declaredPaisa: 1_500_000,
    cashCollectedPaisa: 1_500_000,
    status: "Submitted",
  });

  return db;
}

export const DEMO_PASSWORD_VALUE = DEMO_PASSWORD;
