import { describe, expect, it } from "vitest";
import {
  addDays,
  dhakaParts,
  dhakaToday,
  diffDays,
  formatDate,
  formatDateShort,
  formatDateTime,
  isIsoDate,
  weekdayShort,
} from "@/lib/date";

describe("Asia/Dhaka dates and Bangla numerals", () => {
  it("formats 22 November 2026 in Bangla", () => {
    expect(formatDate("2026-11-22", "bn")).toBe("২২ নভেম্বর ২০২৬");
  });

  it("formats the same day in English", () => {
    expect(formatDate("2026-11-22", "en")).toBe("22 November 2026");
  });

  it("uses a short Bangla month", () => {
    expect(formatDateShort("2026-11-22", "bn")).toBe("২২ নভে");
  });

  it("uses a short English month", () => {
    expect(formatDateShort("2026-04-14", "en")).toBe("14 Apr");
  });

  it("names Sunday in both languages", () => {
    expect(weekdayShort("2026-11-22", "bn")).toBe("রবি");
    expect(weekdayShort("2026-11-22", "en")).toBe("Sun");
  });

  it("rolls a UTC evening into the next Dhaka date", () => {
    const instant = new Date("2026-11-21T18:30:00.000Z");
    expect(dhakaToday(instant)).toBe("2026-11-22");
    expect(dhakaParts(instant)).toEqual({ isoDate: "2026-11-22", time: "00:30" });
  });

  it("keeps late afternoon on the same Dhaka date", () => {
    expect(dhakaToday(new Date("2026-11-22T17:59:00.000Z"))).toBe("2026-11-22");
  });

  it("formats a Dhaka date-time with Bangla digits", () => {
    expect(formatDateTime("2026-11-21T18:30:00.000Z", "bn")).toBe("২২ নভেম্বর ২০২৬ ০০:৩০");
  });

  it("formats a Dhaka date-time in English", () => {
    expect(formatDateTime("2026-11-22T18:00:00.000Z", "en")).toBe("23 November 2026 00:00");
  });

  it("rejects an invalid instant", () => {
    expect(() => formatDateTime("not-a-date")).toThrow(/Invalid date/);
  });

  it("adds days across a month boundary", () => {
    expect(addDays("2026-11-22", 10)).toBe("2026-12-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts whole days", () => {
    expect(diffDays("2026-11-27", "2026-11-22")).toBe(5);
  });

  it("rejects a calendar date that does not exist", () => {
    expect(isIsoDate("2026-02-31")).toBe(false);
    expect(isIsoDate("2026-11-22")).toBe(true);
  });
});
