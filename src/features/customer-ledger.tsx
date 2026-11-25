"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toBnDigits } from "@/lib/money";
import { useAuth } from "@/components/auth-provider";
import { Money } from "@/components/money";
import { Button, Field, TextArea } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { getApi } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/date";
import { errorCode } from "@/lib/errors";
import { idempotencyKey } from "@/lib/idempotency";
import { LEDGER_PAGE_SIZE, ledgerKind } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import type { LedgerEntry } from "@/lib/api/types";

export function CustomerLedger({ partyId }: { partyId: string }) {
  const t = useTranslations("ledger");
  const common = useTranslations("common");
  const locale = useLocale() === "en" ? "en" : "bn";
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<LedgerEntry | null>(null);
  const query = useQuery({
    queryKey: ["ledger", partyId, page],
    queryFn: () => getApi().customers.ledger(partyId, { page, pageSize: LEDGER_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const canReverse = can(user?.role, "ledger.reverse") || can(user?.role, "ledger.reverseOwn");
  const data = query.data;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white" data-testid="ledger-book">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="font-semibold">{t("book")}</h2>
        <p className="text-sm text-muted">
          {t("entries", {
            count: locale === "bn" ? toBnDigits(String(data?.totalCount ?? 0)) : (data?.totalCount ?? 0),
          })}
        </p>
      </div>
      <LedgerEntryList
        entries={data?.items ?? []}
        loading={query.isLoading}
        canReverse={canReverse}
        onReverse={setTarget}
      />
      {data && data.totalPages > 1 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-3"
          data-testid="ledger-pager"
        >
          <p className="text-sm text-muted">
            {t("page", {
              page: locale === "bn" ? toBnDigits(String(data.page)) : data.page,
              total: locale === "bn" ? toBnDigits(String(data.totalPages)) : data.totalPages,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-10"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              {common("back")}
            </Button>
            <Button
              variant="outline"
              className="min-h-10"
              disabled={page >= data.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      ) : null}
      <ReverseDialog entry={target} onClose={() => setTarget(null)} />
    </section>
  );
}

export function LedgerEntryList({
  entries,
  loading = false,
  canReverse = false,
  onReverse,
}: {
  entries: LedgerEntry[];
  loading?: boolean;
  canReverse?: boolean;
  onReverse?: (entry: LedgerEntry) => void;
}) {
  const t = useTranslations("ledger");
  const methods = useTranslations("methods");
  const common = useTranslations("common");
  const locale = useLocale() === "en" ? "en" : "bn";
  const [drawer, setDrawer] = useState<LedgerEntry | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  async function showCorrecting(id: string) {
    const node = document.getElementById(`ledger-entry-${id}`);
    if (node) {
      setDrawer(null);
      setFocusId(id);
      if (typeof node.scrollIntoView === "function") node.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      setDrawer(await getApi().ledger.get(id));
    } catch {
      setFocusId(null);
    }
  }

  if (loading) return <div data-testid="ledger-skeleton" className="m-4 h-40 animate-pulse rounded-2xl bg-canvas" />;
  if (entries.length === 0) {
    return (
      <p data-testid="ledger-empty" className="p-6 text-muted">
        {t("noEntries")}
      </p>
    );
  }

  return (
    <>
      <div className="hidden bg-canvas px-3 py-2 text-sm text-muted md:grid md:grid-cols-[7.5rem_8.5rem_minmax(0,1fr)_7.5rem_7.5rem_auto] md:gap-2">
        <span>{t("date")}</span>
        <span>{t("type")}</span>
        <span>{t("note")}</span>
        <span>{t("amount")}</span>
        <span>{t("runningBalance")}</span>
        <span />
      </div>
      <div data-testid="ledger-rows">
        {entries.map((entry) => {
          const struck = entry.isReversed ? "line-through" : undefined;
          return (
            <article
              key={entry.id}
              id={`ledger-entry-${entry.id}`}
              data-testid={`entry-${entry.documentNo}`}
              data-focused={focusId === entry.id ? "true" : "false"}
              tabIndex={0}
              className={cn("cursor-pointer border-t border-line", focusId === entry.id && "bg-mint")}
              onClick={() => setDrawer(entry)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setDrawer(entry);
                }
              }}
            >
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-3 text-sm md:grid-cols-[7.5rem_8.5rem_minmax(0,1fr)_7.5rem_7.5rem_auto] md:items-center md:gap-2">
                <span className={struck}>{formatDate(entry.entryDate, locale)}</span>
                <span className={cn("justify-self-end font-medium md:justify-self-start", struck)}>
                  {t(`types.${ledgerKind(entry.entryType)}`)}
                </span>
                <span className={cn("col-span-2 break-words text-muted md:col-span-1", struck)}>
                  {entry.note || entry.documentNo}
                </span>
                <span className={struck}>
                  <span className="mb-0.5 block text-xs text-muted md:hidden">{t("amount")}</span>
                  <Money
                    value={entry.amount}
                    tone={entry.isReversed ? "muted" : entry.direction === "Dr" ? "due" : "paid"}
                  />
                </span>
                <span className={struck}>
                  <span className="mb-0.5 block text-xs text-muted md:hidden">{t("runningBalance")}</span>
                  <Money value={entry.balanceAfter} />
                </span>
                <span className="col-span-2 flex flex-wrap items-center gap-3 md:col-span-1 md:justify-end">
                  {entry.isReversed && entry.reversedByEntryId ? (
                    <button
                      type="button"
                      data-testid={`corrected-by-${entry.id}`}
                      className="text-sm font-semibold text-primary underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        void showCorrecting(entry.reversedByEntryId!);
                      }}
                    >
                      {t("correctedBy", { ref: entry.reversedByDocumentNo ?? entry.reversedByEntryId })}
                    </button>
                  ) : null}
                  {canReverse && onReverse && !entry.isReversed && entry.entryType !== "Reversal" ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReverse(entry);
                      }}
                    >
                      {t("reverse")}
                    </button>
                  ) : null}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      {drawer ? (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label={common("close")}
            onClick={() => setDrawer(null)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="ledger-drawer-title"
            data-testid="ledger-drawer"
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="ledger-drawer-title" className="text-lg font-semibold">
                {t("drawerTitle")}
              </h2>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-mint"
                aria-label={common("close")}
                onClick={() => setDrawer(null)}
              >
                {common("close")}
              </button>
            </div>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <DrawerRow label={t("documentNo")} value={drawer.documentNo} />
              <DrawerRow label={t("date")} value={formatDate(drawer.entryDate, locale)} />
              <DrawerRow label={t("type")} value={t(`types.${ledgerKind(drawer.entryType)}`)} />
              <div>
                <dt className="text-muted">{t("amount")}</dt>
                <dd className="mt-0.5">
                  <Money value={drawer.amount} tone={drawer.direction === "Dr" ? "due" : "paid"} />
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t("runningBalance")}</dt>
                <dd className="mt-0.5">
                  <Money value={drawer.balanceAfter} />
                </dd>
              </div>
              <DrawerRow label={t("note")} value={drawer.note || "—"} />
              <DrawerRow label={t("recordedBy")} value={drawer.createdByName || "—"} />
              <DrawerRow label={t("recordedAt")} value={formatDateTime(drawer.createdAtUtc, locale)} />
              <DrawerRow label={t("method")} value={drawer.paymentMethod ? methods(drawer.paymentMethod) : "—"} />
              {drawer.referenceNo ? <DrawerRow label={t("reference")} value={drawer.referenceNo} /> : null}
              {drawer.reversalReason ? <DrawerRow label={t("reversalReason")} value={drawer.reversalReason} /> : null}
            </dl>
            {drawer.reversalOfEntryId ? (
              <p className="mt-4 text-sm font-medium">
                {t("reversalOf", { ref: drawer.reversalOfDocumentNo ?? drawer.reversalOfEntryId })}
              </p>
            ) : null}
            {drawer.isReversed && drawer.reversedByEntryId ? (
              <button
                type="button"
                className="mt-4 self-start text-sm font-semibold text-primary underline"
                onClick={() => void showCorrecting(drawer.reversedByEntryId!)}
              >
                {t("correctedBy", { ref: drawer.reversedByDocumentNo ?? drawer.reversedByEntryId })}
              </button>
            ) : null}
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-canvas p-4">
              <p className="text-sm font-semibold">{t("attachments")}</p>
              <p className="mt-1 text-sm text-muted">{t("noAttachments")}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium break-words">{value}</dd>
    </div>
  );
}

export function ReverseDialog({ entry, onClose }: { entry: LedgerEntry | null; onClose: () => void }) {
  const t = useTranslations("ledger");
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <Dialog open={Boolean(entry)} title={t("reverse")} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!entry) return;
          if (!reason.trim()) {
            setError(errors("REASON_REQUIRED"));
            return;
          }
          try {
            await getApi().ledger.reverse(entry.id, { reason }, idempotencyKey());
            await client.invalidateQueries();
            toast(t("reversedOk"));
            onClose();
          } catch (err) {
            setError(errors(errorCode(err) as "UNKNOWN"));
          }
        }}
      >
        <Field label={t("reason")} error={error}>
          <TextArea data-testid="reverse-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
        <Button type="submit" variant="danger">
          {t("reverse")}
        </Button>
      </form>
    </Dialog>
  );
}
