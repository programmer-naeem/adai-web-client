/** Business dates are `YYYY-MM-DD` in the tenant timezone (default Asia/Dhaka, BR-2.5). */

import { toBnDigits } from "@/lib/money";

export const DEMO_TODAY = "2026-11-22";

const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT_BN = [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রি",
  "মে",
  "জুন",
  "জুল",
  "আগ",
  "সেপ্টে",
  "অক্টো",
  "নভে",
  "ডিসে",
];

const WEEKDAY_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** later − earlier, in whole days. */
export function diffDays(later: string, earlier: string): number {
  const a = Date.parse(`${later}T00:00:00Z`);
  const b = Date.parse(`${earlier}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function weekdayShort(iso: string, locale: "bn" | "en"): string {
  const index = weekdayIndex(iso);
  return locale === "bn" ? WEEKDAY_BN[index]! : WEEKDAY_EN[index]!;
}

export function formatDate(iso: string, locale: "bn" | "en" = "bn"): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (locale === "en") return `${d} ${MONTHS_EN[m! - 1]} ${y}`;
  return toBnDigits(`${d} ${MONTHS_BN[m! - 1]} ${y}`);
}

export function formatDateShort(iso: string, locale: "bn" | "en" = "bn"): string {
  const [, m, d] = iso.split("-").map(Number);
  if (locale === "en") return `${d} ${MONTHS_EN[m! - 1]!.slice(0, 3)}`;
  return toBnDigits(`${d} ${MONTHS_SHORT_BN[m! - 1]}`);
}

export function dhakaToday(now = new Date()): string {
  return dhakaParts(now).isoDate;
}

export interface DhakaParts {
  isoDate: string;
  time: string;
}

/** Calendar date and 24-hour time in Asia/Dhaka. */
export function dhakaParts(instant: Date): DhakaParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = pick("hour") === "24" ? "00" : pick("hour");
  return { isoDate: `${pick("year")}-${pick("month")}-${pick("day")}`, time: `${hour}:${pick("minute")}` };
}

/** Format an instant in Asia/Dhaka, with Bangla digits when locale is bn. */
export function formatDateTime(isoUtc: string, locale: "bn" | "en" = "bn"): string {
  const instant = new Date(isoUtc);
  if (Number.isNaN(instant.getTime())) throw new Error("Invalid date");
  const { isoDate, time } = dhakaParts(instant);
  const clock = locale === "bn" ? toBnDigits(time) : time;
  return `${formatDate(isoDate, locale)} ${clock}`;
}

/**
 * Mock mode is anchored to the Stitch design date so overdue badges and
 * "today" stay stable. Real mode uses Asia/Dhaka.
 */
export function businessToday(): string {
  if (process.env.NEXT_PUBLIC_API_MODE === "real") return dhakaToday();
  return DEMO_TODAY;
}

export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, index) => addDays(today, index - (n - 1)));
}
