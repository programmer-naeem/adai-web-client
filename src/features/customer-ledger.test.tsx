import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { LedgerEntryList } from "@/features/customer-ledger";
import { formatDateTime } from "@/lib/date";
import type { LedgerEntry } from "@/lib/api/types";
import messages from "../../messages/bn.json";

function entry(
  partial: Partial<LedgerEntry> &
    Pick<
      LedgerEntry,
      "id" | "documentNo" | "entryType" | "direction" | "amount" | "entryDate" | "sequenceNo" | "balanceAfter"
    >,
): LedgerEntry {
  return {
    partyId: "cus_karim",
    isReversed: false,
    createdAtUtc: "2026-11-21T06:00:00.000Z",
    createdByName: "হাজী আব্দুর রহিম",
    note: "পাইপ",
    ...partial,
  };
}

function renderList(entries: LedgerEntry[], loading = false) {
  return render(
    <NextIntlClientProvider locale="bn" messages={messages}>
      <LedgerEntryList entries={entries} loading={loading} />
    </NextIntlClientProvider>,
  );
}

const sale = entry({
  id: "sale",
  documentNo: "DUE-9",
  entryType: "CreditSale",
  direction: "Dr",
  amount: "3200.00",
  entryDate: "2026-11-21",
  sequenceNo: 2,
  balanceAfter: "17700.00",
  note: "ভুল এন্ট্রি — রফিক স্যানিটারির মাল",
  isReversed: true,
  reversedByEntryId: "rev",
  reversedByDocumentNo: "REV-0007",
  reversalReason: "ভুল কাস্টমারে লেখা হয়েছিল",
  createdByName: "হাজী আব্দুর রহিম",
});

const reversal = entry({
  id: "rev",
  documentNo: "REV-0007",
  entryType: "Reversal",
  direction: "Cr",
  amount: "3200.00",
  entryDate: "2026-11-22",
  sequenceNo: 3,
  balanceAfter: "14500.00",
  note: "ভুল কাস্টমারে লেখা হয়েছিল",
  reversalOfEntryId: "sale",
  reversalOfDocumentNo: "DUE-9",
  createdAtUtc: "2026-11-22T06:00:00.000Z",
  createdByName: "তানভীর আহমেদ",
});

describe("ledger reversal display", () => {
  afterEach(() => cleanup());

  it("strikes a reversed entry and scrolls to the correcting entry", async () => {
    const user = userEvent.setup();
    renderList([reversal, sale]);

    expect(screen.getByText("ভুল এন্ট্রি — রফিক স্যানিটারির মাল")).toHaveClass("line-through");
    expect(screen.getByTestId("corrected-by-sale")).toHaveTextContent("সংশোধন করেছেন REV-0007");
    expect(screen.getByTestId("entry-REV-0007")).not.toHaveClass("line-through");

    await user.click(screen.getByTestId("corrected-by-sale"));
    expect(document.getElementById("ledger-entry-rev")).toHaveAttribute("data-focused", "true");
    expect(screen.queryByTestId("ledger-drawer")).not.toBeInTheDocument();
  });

  it("opens the entry drawer with who recorded it and the created time", async () => {
    const user = userEvent.setup();
    renderList([sale]);
    await user.click(screen.getByTestId("entry-DUE-9"));
    const drawer = screen.getByTestId("ledger-drawer");
    expect(drawer).toHaveTextContent("হাজী আব্দুর রহিম");
    expect(drawer).toHaveTextContent(formatDateTime(sale.createdAtUtc, "bn"));
    expect(drawer).toHaveTextContent(messages.ledger.noAttachments);
    expect(drawer).toHaveTextContent("ভুল কাস্টমারে লেখা হয়েছিল");
  });

  it("shows a loading skeleton and an empty state", () => {
    const { rerender } = renderList([], true);
    expect(screen.getByTestId("ledger-skeleton")).toBeInTheDocument();
    rerender(
      <NextIntlClientProvider locale="bn" messages={messages}>
        <LedgerEntryList entries={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId("ledger-empty")).toHaveTextContent(messages.ledger.noEntries);
  });
});
