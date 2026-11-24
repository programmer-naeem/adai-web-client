import { describe, expect, it } from "vitest";
import { formatPhone, isBdPhone, normalizeBdPhone, telHref, whatsAppHref } from "@/lib/phone";

describe("BR-1.2 phone", () => {
  it("accepts a local 017 number", () => {
    expect(normalizeBdPhone("01711345678")).toBe("+8801711345678");
  });

  it("accepts +880", () => {
    expect(normalizeBdPhone("+8801812456789")).toBe("+8801812456789");
  });

  it("accepts 880 without a plus", () => {
    expect(normalizeBdPhone("8801913567890")).toBe("+8801913567890");
  });

  it("strips spaces and hyphens", () => {
    expect(normalizeBdPhone("01711-345-678")).toBe("+8801711345678");
  });

  it("accepts 013 through 019", () => {
    for (const prefix of ["013", "014", "015", "016", "017", "018", "019"]) {
      expect(isBdPhone(`${prefix}12345678`)).toBe(true);
    }
  });

  it("rejects 012", () => {
    expect(isBdPhone("01212345678")).toBe(false);
  });

  it("rejects a short number", () => {
    expect(isBdPhone("017123")).toBe(false);
  });

  it("rejects letters", () => {
    expect(isBdPhone("01711abc678")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isBdPhone("")).toBe(false);
  });

  it("formats Bangla local digits", () => {
    expect(formatPhone("+8801711345678", "bn")).toBe("০১৭১১-৩৪৫৬৭৮");
  });

  it("formats English local digits", () => {
    expect(formatPhone("+8801711345678", "en")).toBe("01711-345678");
  });

  it("builds tel and WhatsApp links", () => {
    expect(telHref("+8801711345678")).toBe("tel:+8801711345678");
    expect(whatsAppHref("+8801711345678", "বাকি")).toContain("wa.me/8801711345678");
  });
});
