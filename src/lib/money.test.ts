import { describe, expect, it } from "vitest";
import { formatBDT, groupLakh, parseMoneyToPaisa, paisaToMoneyString, percentOfPaisa, toBnDigits } from "@/lib/money";

describe("formatBDT", () => {
  it("groups a lakh in Bangla with the taka sign", () => {
    expect(formatBDT(12_345_600)).toBe("৳১,২৩,৪৫৬");
  });

  it("groups a crore", () => {
    expect(formatBDT(1_00_00_000_00)).toBe("৳১,০০,০০,০০০");
  });

  it("keeps a small amount", () => {
    expect(formatBDT(200_000)).toBe("৳২,০০০");
  });

  it("shows a non-zero fraction", () => {
    expect(formatBDT(12_550)).toBe("৳১২৫.৫০");
  });

  it("hides .00 by default", () => {
    expect(formatBDT(100)).toBe("৳১");
  });

  it("can keep a zero fraction", () => {
    expect(formatBDT(100, { trimZeroFraction: false })).toBe("৳১.০০");
  });

  it("formats English without Bangla digits", () => {
    expect(formatBDT(1_485_0000, { locale: "en" })).toBe("৳1,48,500");
  });

  it("puts the minus before the digits", () => {
    expect(formatBDT(-300_000, { locale: "en" })).toBe("৳-3,000");
  });

  it("can omit the symbol", () => {
    expect(formatBDT(50_000, { locale: "en", withSymbol: false })).toBe("500");
  });

  it("rounds a half paisa away from zero", () => {
    expect(percentOfPaisa(100, 0.5)).toBe(1);
    expect(percentOfPaisa(-100, 0.5)).toBe(-1);
  });

  it("parses two-decimal strings", () => {
    expect(parseMoneyToPaisa("12500.50")).toBe(1_250_050);
    expect(parseMoneyToPaisa("-3000")).toBe(-300_000);
  });

  it("rejects a float and a third decimal", () => {
    expect(() => parseMoneyToPaisa("1.234")).toThrow(/Invalid money/);
    expect(() => parseMoneyToPaisa("10.5.0")).toThrow(/Invalid money/);
  });

  it("round-trips paisa", () => {
    expect(paisaToMoneyString(1_485_0000)).toBe("148500.00");
    expect(parseMoneyToPaisa(paisaToMoneyString(-50))).toBe(-50);
  });

  it("groups 1234567 as 12,34,567", () => {
    expect(groupLakh("1234567")).toBe("12,34,567");
  });

  it("converts digits", () => {
    expect(toBnDigits("2026")).toBe("২০২৬");
  });
});
