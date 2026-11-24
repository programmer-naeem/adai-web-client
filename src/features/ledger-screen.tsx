"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Money } from "@/components/money";
import { Badge, Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Link, useRouter } from "@/i18n/navigation";
import { getApi, isApiError } from "@/lib/api";
import { businessToday, formatDate } from "@/lib/date";
import { errorCode } from "@/lib/errors";
import { idempotencyKey } from "@/lib/idempotency";
import { paisaToMoneyString, parseMoneyToPaisa } from "@/lib/money";
import { can } from "@/lib/permissions";
import { formatPhone, telHref, whatsAppHref } from "@/lib/phone";
import type { Customer, LedgerEntry, PaymentMethod } from "@/lib/api/types";

const METHODS: PaymentMethod[] = ["Cash", "Bkash", "Nagad", "Rocket", "Bank", "Cheque", "Card", "Other"];
const NEEDS_REF = new Set<PaymentMethod>(["Bkash", "Nagad", "Rocket", "Bank", "Cheque"]);

export function CustomerLedgerScreen({ id, tab }: { id: string; tab: string }) {
  const customer = useQuery({ queryKey: ["customer", id], queryFn: () => getApi().customers.get(id) });
  if (!customer.data) return <p className="text-muted">…</p>;
  return <LedgerView party={customer.data} kind="customer" tab={tab} />;
}

export function SupplierLedgerScreen({ id }: { id: string }) {
  const supplier = useQuery({ queryKey: ["supplier", id], queryFn: () => getApi().suppliers.get(id) });
  if (!supplier.data) return <p className="text-muted">…</p>;
  return <LedgerView party={supplier.data} kind="supplier" tab="ledger" />;
}

function LedgerView({ party, kind, tab }: { party: Customer; kind: "customer" | "supplier"; tab: string }) {
  const t = useTranslations("ledger");
  const tabs = useTranslations("tabs");
  const buckets = useTranslations("buckets");
  const common = useTranslations("common");
  const locale = useLocale() === "en" ? "en" : "bn";
  const { user } = useAuth();
  const router = useRouter();
  const [entryOpen, setEntryOpen] = useState(false);
  const [mode, setMode] = useState<"credit" | "payment">("credit");
  const aging = useQuery({ queryKey: ["party-aging", party.id], queryFn: () => getApi().customers.aging(party.id), enabled: kind === "customer" });
  const ledger = useQuery({
    queryKey: ["ledger", party.id],
    queryFn: () => (kind === "customer" ? getApi().customers.ledger(party.id) : getApi().suppliers.ledger(party.id)),
  });
  const promises = useQuery({ queryKey: ["promises", party.id], queryFn: () => getApi().collections.promises(), enabled: kind === "customer" && tab === "promises" });
  const messages = useQuery({ queryKey: ["messages", party.id], queryFn: () => getApi().customers.messages(party.id), enabled: kind === "customer" && tab === "messages" });
  const timeline = useQuery({ queryKey: ["timeline", party.id], queryFn: () => getApi().customers.timeline(party.id), enabled: kind === "customer" && tab === "timeline" });
  const canCredit = kind === "customer" ? can(user?.role, "ledger.creditSale") : can(user?.role, "ledger.paymentMade");
  const canPay = kind === "customer" ? can(user?.role, "ledger.payment") : can(user?.role, "ledger.paymentMade");
  const balance = parseMoneyToPaisa(party.balance);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={kind === "customer" ? "/customers" : "/suppliers"} className="text-sm font-semibold text-primary">{common("back")}</Link>
        <h1 className="mt-1 text-2xl font-bold">{locale === "en" && party.nameEn ? party.nameEn : party.name}</h1>
        <p className="text-sm text-muted">{t("subtitle", { business: "" })} · {formatPhone(party.phoneE164, locale)} · {party.area}</p>
      </div>
      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-muted">{balance < 0 ? common("advance") : kind === "customer" ? t("totalDue") : common("payable")}</p>
        <p className="text-3xl" data-testid="party-balance"><Money value={party.balance} absolute tone={balance < 0 ? "paid" : balance === 0 ? "ink" : "due"} /></p>
        {party.nextDueDate ? <p className="mt-1 text-sm text-muted">{t("dueDate")}: {formatDate(party.nextDueDate, locale)}</p> : null}
        {aging.data ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {aging.data.buckets.map((bucket) => (
              <div key={bucket.key} className="rounded-xl bg-canvas px-3 py-2">
                <p className="text-muted">{buckets(bucket.key)}</p>
                <Money value={bucket.amount} />
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {canCredit ? <Button data-testid="entry-open-credit" onClick={() => { setMode("credit"); setEntryOpen(true); }}>{kind === "customer" ? t("giveCredit") : t("giveCredit")}</Button> : null}
          {canPay ? <Button data-testid="entry-open-payment" variant="outline" onClick={() => { setMode("payment"); setEntryOpen(true); }}>{t("receive")}</Button> : null}
          <a className="inline-flex min-h-12 items-center rounded-xl border border-line px-4 font-semibold" href={telHref(party.phoneE164)}>{t("call")}</a>
          {kind === "customer" ? <a className="inline-flex min-h-12 items-center rounded-xl border border-line px-4 font-semibold" href={whatsAppHref(party.phoneE164)}>{t("whatsapp")}</a> : null}
          {kind === "customer" ? <ShareButton id={party.id} /> : null}
          <Button variant="ghost" onClick={() => window.print()}>{t("pdf")}</Button>
        </div>
      </section>
      {kind === "customer" ? (
        <div className="flex gap-2">
          {(["ledger", "promises", "messages", "timeline"] as const).map((item) => (
            <button key={item} type="button" className={`rounded-full px-3 py-2 text-sm font-semibold ${tab === item ? "bg-primary text-white" : "bg-white"}`} onClick={() => router.replace(`/customers/${party.id}?tab=${item}`)}>
              {tabs(item)}
            </button>
          ))}
        </div>
      ) : null}
      {tab === "ledger" || kind === "supplier" ? (
        <LedgerTable entries={ledger.data ?? []} party={party} kind={kind} />
      ) : null}
      {tab === "promises" ? (
        <ul className="flex flex-col gap-2">
          {(promises.data ?? []).filter((item) => item.customerId === party.id).map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <Money value={item.amount} />
                <Badge tone={item.status === "Broken" ? "danger" : item.status === "Kept" ? "ok" : "amber"}>{item.status}</Badge>
              </div>
              <p className="text-sm text-muted">{formatDate(item.promiseDate, locale)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "messages" ? (
        <ul className="flex flex-col gap-2">
          {(messages.data ?? []).map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
              <p className="font-semibold">{item.channel} · {item.status}</p>
              <p className="mt-1">{item.renderedBody}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "timeline" ? (
        <ul className="flex flex-col gap-2">
          {(timeline.data ?? []).map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <EntryDialog open={entryOpen} mode={mode} party={party} kind={kind} onClose={() => setEntryOpen(false)} />
    </div>
  );
}

function ShareButton({ id }: { id: string }) {
  const t = useTranslations("ledger");
  const toast = useToast();
  const common = useTranslations("common");
  return (
    <Button variant="outline" data-testid="share-statement" onClick={async () => {
      const customer = await getApi().customers.get(id);
      const link = await getApi().customers.createStatementLink(id);
      const url = `${window.location.origin}${link.path}`;
      await navigator.clipboard.writeText(url);
      toast(common("copied"));
      window.open(whatsAppHref(customer.phoneE164, url), "_blank", "noopener,noreferrer");
    }}>{t("share")}</Button>
  );
}

function LedgerTable({ entries, party, kind }: { entries: LedgerEntry[]; party: Customer; kind: "customer" | "supplier" }) {
  const t = useTranslations("ledger");
  const locale = useLocale() === "en" ? "en" : "bn";
  const { user } = useAuth();
  const [target, setTarget] = useState<LedgerEntry | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const canReverse = can(user?.role, "ledger.reverse") || can(user?.role, "ledger.reverseOwn");
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold">{t("book")}</h2>
        <p className="text-sm text-muted">{t("entries", { count: entries.length })}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("date")}</th>
              <th className="px-3 py-2 font-medium">{t("description")}</th>
              <th className="px-3 py-2 font-medium">{t("gave")}</th>
              <th className="px-3 py-2 font-medium">{t("got")}</th>
              <th className="px-3 py-2 font-medium">{t("balance")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const gave = kind === "customer" ? entry.direction === "Dr" : entry.direction === "Cr";
              return (
                <tr key={entry.id} className={`border-t border-line ${entry.isReversed ? "line-through opacity-60" : ""}`} data-testid={`entry-${entry.documentNo}`}>
                  <td className="px-3 py-3">{formatDate(entry.entryDate, locale)}</td>
                  <td className="px-3 py-3">
                    <p>{entry.note || entry.documentNo}</p>
                    {entry.isReversed ? <Badge tone="danger">{t("reversed")}</Badge> : null}
                  </td>
                  <td className="px-3 py-3">{gave ? <Money value={entry.amount} tone="due" /> : "—"}</td>
                  <td className="px-3 py-3">{gave ? "—" : <Money value={entry.amount} tone="paid" />}</td>
                  <td className="px-3 py-3"><Money value={entry.balanceAfter} /></td>
                  <td className="px-3 py-3">
                    {canReverse && !entry.isReversed && entry.entryType !== "Reversal" ? (
                      <button type="button" className="text-sm font-semibold text-danger" onClick={() => { setCorrecting(false); setTarget(entry); }}>{t("reverse")}</button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 ? <p className="p-4 text-muted">{t("noEntries")}</p> : null}
      </div>
      <ReverseDialog entry={target} correcting={correcting} onClose={() => setTarget(null)} partyId={party.id} />
    </section>
  );
}

function EntryDialog({ open, mode, party, kind, onClose }: { open: boolean; mode: "credit" | "payment"; party: Customer; kind: "customer" | "supplier"; onClose: () => void }) {
  const t = useTranslations("ledger");
  const methods = useTranslations("methods");
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(businessToday());
  const [due, setDue] = useState(businessToday());
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const preview = useQuery({
    queryKey: ["alloc", party.id, amount],
    queryFn: () => getApi().payments.allocationPreview(party.id, paisaToMoneyString(parseMoneyToPaisa(amount))),
    enabled: open && mode === "payment" && kind === "customer" && /^\d+(\.\d{1,2})?$/.test(amount),
  });

  const save = useMutation({
    mutationFn: async () => {
      const money = paisaToMoneyString(parseMoneyToPaisa(amount));
      const key = idempotencyKey();
      if (kind === "supplier") {
        return mode === "credit"
          ? getApi().ledger.creditPurchase({ supplierId: party.id, amount: money, entryDate: date, dueDate: due, note }, key)
          : getApi().payments.make({ supplierId: party.id, amount: money, method, referenceNo: reference, entryDate: date, note }, key);
      }
      if (mode === "credit") {
        return getApi().ledger.creditSale({ customerId: party.id, amount: money, entryDate: date, dueDate: due, note, notify }, key);
      }
      try {
        return await getApi().payments.receive({ customerId: party.id, amount: money, method, referenceNo: reference, entryDate: date, note, notify }, key);
      } catch (err) {
        if (isApiError(err) && err.code === "BR-6.2") {
          return getApi().collections.submitPending({ customerId: party.id, amount: money, method, referenceNo: reference, entryDate: date, note });
        }
        throw err;
      }
    },
    onSuccess: async (result) => {
      if ("possibleDuplicate" in result && result.possibleDuplicate && !confirmDuplicate) {
        setConfirmDuplicate(true);
        setError(t("duplicateWarning"));
        return;
      }
      await client.invalidateQueries();
      toast(t("saved"));
      if ("creditLimitExceeded" in result && result.creditLimitExceeded) toast(t("creditWarning"), "danger");
      onClose();
    },
    onError: (err) => setError(errors(errorCode(err) as "UNKNOWN")),
  });

  return (
    <Dialog open={open} title={mode === "credit" ? t("giveCredit") : t("receive")} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <Field label={t("amount")} error={error}>
          <TextInput data-testid="entry-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>
        <Field label={t("date")}><TextInput data-testid="entry-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
        {mode === "credit" ? <Field label={t("dueOn")}><TextInput type="date" value={due} onChange={(event) => setDue(event.target.value)} /></Field> : null}
        {mode === "payment" ? (
          <Field label={t("method")}>
            <select data-testid="entry-method" className="h-12 rounded-xl border border-line px-3" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              {METHODS.map((item) => <option key={item} value={item}>{methods(item)}</option>)}
            </select>
          </Field>
        ) : null}
        {mode === "payment" && NEEDS_REF.has(method) ? <Field label={t("reference")}><TextInput value={reference} onChange={(event) => setReference(event.target.value)} /></Field> : null}
        <Field label={t("description")}><TextArea data-testid="entry-note" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
        {kind === "customer" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} />{t("notify")}</label> : null}
        {preview.data && preview.data.length > 0 ? (
          <div className="rounded-xl bg-canvas p-3 text-sm">
            <p className="font-semibold">{t("preview")}</p>
            {preview.data.map((row) => <p key={row.dueItemId}>{row.documentNo}: {row.amount}</p>)}
          </div>
        ) : null}
        <Button data-testid="entry-save" type="submit" disabled={save.isPending}>{t("newEntry")}</Button>
      </form>
    </Dialog>
  );
}

function ReverseDialog({ entry, correcting, onClose, partyId }: { entry: LedgerEntry | null; correcting: boolean; onClose: () => void; partyId: string }) {
  const t = useTranslations("ledger");
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  void correcting;
  void partyId;
  return (
    <Dialog open={Boolean(entry)} title={t("reverse")} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={async (event) => {
        event.preventDefault();
        if (!entry) return;
        if (!reason.trim()) { setError(errors("REASON_REQUIRED")); return; }
        try {
          await getApi().ledger.reverse(entry.id, { reason }, idempotencyKey());
          await client.invalidateQueries();
          toast(t("reversedOk"));
          onClose();
        } catch (err) {
          setError(errors(errorCode(err) as "UNKNOWN"));
        }
      }}>
        <Field label={t("reason")} error={error}><TextArea data-testid="reverse-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
        <Button type="submit" variant="danger">{t("reverse")}</Button>
      </form>
    </Dialog>
  );
}
