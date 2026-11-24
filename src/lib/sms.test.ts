import { describe, expect, it } from "vitest";
import { messageCostPaisa, smsSegments } from "@/lib/sms";
import { renderTemplate, UnknownPlaceholderError } from "@/lib/templates";
import { can } from "@/lib/permissions";

describe("SMS segments BR-8.9", () => {
  it("counts 70 Bangla characters as one segment", () => {
    expect(smsSegments("ক".repeat(70)).segments).toBe(1);
  });

  it("counts 71 Bangla characters as two segments", () => {
    expect(smsSegments("ক".repeat(71)).segments).toBe(2);
  });

  it("counts 134 Bangla characters as two segments", () => {
    expect(smsSegments("ক".repeat(134)).segments).toBe(2);
  });

  it("counts 135 Bangla characters as three segments", () => {
    expect(smsSegments("ক".repeat(135)).segments).toBe(3);
  });

  it("counts 160 English characters as one segment", () => {
    expect(smsSegments("a".repeat(160))).toEqual({ segments: 1, encoding: "gsm7", length: 160 });
  });

  it("counts 161 English characters as two segments", () => {
    expect(smsSegments("a".repeat(161)).segments).toBe(2);
  });

  it("prices SMS by segment and WhatsApp per message", () => {
    expect(messageCostPaisa("Sms", "ক".repeat(71))).toBe(100);
    expect(messageCostPaisa("WhatsApp", "hello")).toBe(80);
  });
});

describe("templates", () => {
  it("rejects an unknown placeholder", () => {
    expect(() => renderTemplate("Hello {{not_a_field}}", {})).toThrow(UnknownPlaceholderError);
  });

  it("fills a known placeholder", () => {
    expect(renderTemplate("{{customer_name}}", { customer_name: "করিম" })).toBe("করিম");
  });
});

describe("permissions", () => {
  it("lets a collector take a payment and hides settings", () => {
    expect(can("Collector", "ledger.payment")).toBe(true);
    expect(can("Collector", "settings.manage")).toBe(false);
    expect(can("Owner", "staff.assignOwner")).toBe(true);
    expect(can("Manager", "staff.assignOwner")).toBe(false);
  });
});
