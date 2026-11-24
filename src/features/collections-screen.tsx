"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Money } from "@/components/money";
import { Badge, Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { getApi } from "@/lib/api";
import { addDays, businessToday, formatDate } from "@/lib/date";
import { errorCode } from "@/lib/errors";
import { paisaToMoneyString, parseMoneyToPaisa } from "@/lib/money";
import { formatPhone, telHref, whatsAppHref } from "@/lib/phone";
import type { CollectTodayItem } from "@/lib/api/types";

const BUCKETS = ["b0_30", "b31_60", "b61_90", "b90"] as const;

export function CollectionsScreen() {
  const t = useTranslations("collections");
  const buckets = useTranslations("buckets");
  const status = useTranslations("status");
  const locale = useLocale() === "en" ? "en" : "bn";
  const toast = useToast();
  const client = useQueryClient();
  const [tab, setTab] = useState<"today" | "overdue" | "promises" | "approvals" | "handover">("today");
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]>("b0_30");
  const [contact, setContact] = useState<CollectTodayItem | null>(null);
  const [promiseFor, setPromiseFor] = useState<CollectTodayItem | null>(null);
  const today = useQuery({ queryKey: ["collect-today"], queryFn: () => getApi().collections.today() });
  const overdue = useQuery({ queryKey: ["overdue", bucket], queryFn: () => getApi().collections.overdue(bucket), enabled: tab === "overdue" });
  const promises = useQuery({ queryKey: ["promises"], queryFn: () => getApi().collections.promises() });
  const pending = useQuery({ queryKey: ["pending"], queryFn: () => getApi().collections.pending(), enabled: tab === "approvals" });
  const handovers = useQuery({ queryKey: ["handovers"], queryFn: () => getApi().collections.handovers(), enabled: tab === "handover" });
  const counts = useQuery({
    queryKey: ["overdue-counts"],
    queryFn: async () => {
      const rows = await Promise.all(BUCKETS.map((key) => getApi().collections.overdue(key)));
      return Object.fromEntries(BUCKETS.map((key, index) => [key, rows[index]?.length ?? 0])) as Record<(typeof BUCKETS)[number], number>;
    },
  });

  const rows = tab === "overdue" ? overdue.data ?? [] : today.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
      <div className="flex flex-wrap gap-2">
        {(["today", "overdue", "promises", "approvals", "handover"] as const).map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-2 text-sm font-semibold ${tab === item ? "bg-primary text-white" : "bg-white"}`} onClick={() => setTab(item)}>{t(item)}</button>
        ))}
      </div>
      {tab === "overdue" ? (
        <div className="flex flex-wrap gap-2">
          {BUCKETS.map((key) => (
            <button key={key} type="button" className={`rounded-full px-3 py-2 text-sm font-semibold ${bucket === key ? "bg-amber text-white" : "bg-white"}`} onClick={() => setBucket(key)}>
              {buckets(key)} ({counts.data?.[key] ?? 0})
            </button>
          ))}
        </div>
      ) : null}
      {(tab === "today" || tab === "overdue") ? (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.customerId} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/customers/${row.customerId}`} className="text-lg font-semibold">{row.name}</Link>
                  <p className="text-sm text-muted">{row.area} · {formatPhone(row.phoneE164, locale)}</p>
                </div>
                <Money value={row.balance} tone="due" className="text-lg" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="rounded-xl bg-mint px-3 py-2 text-sm font-semibold text-primary" href={telHref(row.phoneE164)}>{t("log")}</a>
                <a className="rounded-xl bg-mint px-3 py-2 text-sm font-semibold text-primary" href={whatsAppHref(row.phoneE164)}>WhatsApp</a>
                <Button variant="outline" className="min-h-10" onClick={() => setPromiseFor(row)}>{t("addPromise")}</Button>
                <Button variant="ghost" className="min-h-10" onClick={() => setContact(row)}>{t("log")}</Button>
              </div>
            </li>
          ))}
          {rows.length === 0 ? <p className="text-muted">{t("emptyToday")}</p> : null}
        </ul>
      ) : null}
      {tab === "promises" ? (
        <ul className="flex flex-col gap-2">
          {(promises.data ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
              <div>
                <p className="font-semibold">{item.customerName}</p>
                <p className="text-sm text-muted">{formatDate(item.promiseDate, locale)}</p>
              </div>
              <div className="text-right">
                <Money value={item.amount} />
                <div><Badge tone={item.status === "Broken" ? "danger" : item.status === "Kept" ? "ok" : "amber"}>{status(item.status)}</Badge></div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "approvals" ? (
        <ul className="flex flex-col gap-2">
          {(pending.data ?? []).filter((item) => item.status === "Pending").map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="font-semibold">{item.customerName} · {item.collectorName}</p>
              <Money value={item.amount} />
              <div className="mt-2 flex gap-2">
                <Button onClick={async () => { await getApi().collections.approvePending(item.id); await client.invalidateQueries(); toast(t("saved")); }}>{t("approve")}</Button>
                <Button variant="outline" onClick={async () => { await getApi().collections.rejectPending(item.id, "ভুল জমা"); await client.invalidateQueries(); }}>{t("reject")}</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "handover" ? (
        <HandoverPanel rows={handovers.data ?? []} onChange={() => client.invalidateQueries({ queryKey: ["handovers"] })} />
      ) : null}
      <ContactDialog item={contact} onClose={() => setContact(null)} />
      <PromiseDialog item={promiseFor} onClose={() => setPromiseFor(null)} />
    </div>
  );
}

function ContactDialog({ item, onClose }: { item: CollectTodayItem | null; onClose: () => void }) {
  const t = useTranslations("collections");
  const toast = useToast();
  const client = useQueryClient();
  const [outcome, setOutcome] = useState<"Promised" | "Paid" | "NotReachable" | "Disputed" | "Refused">("Promised");
  const [note, setNote] = useState("");
  return (
    <Dialog open={Boolean(item)} title={t("log")} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={async (event) => {
        event.preventDefault();
        if (!item) return;
        await getApi().collections.logContact({ customerId: item.customerId, channel: "Call", outcome, note });
        await client.invalidateQueries({ queryKey: ["timeline", item.customerId] });
        toast(t("saved"));
        onClose();
      }}>
        <Field label={t("outcome")}>
          <select className="h-12 rounded-xl border border-line px-3" value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}>
            {(["Promised", "Paid", "NotReachable", "Disputed", "Refused"] as const).map((key) => <option key={key} value={key}>{t(key)}</option>)}
          </select>
        </Field>
        <Field label={t("log")}><TextArea value={note} onChange={(event) => setNote(event.target.value)} /></Field>
        <Button type="submit">{t("saved")}</Button>
      </form>
    </Dialog>
  );
}

function PromiseDialog({ item, onClose }: { item: CollectTodayItem | null; onClose: () => void }) {
  const t = useTranslations("collections");
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(addDays(businessToday(), 1));
  const [error, setError] = useState("");
  return (
    <Dialog open={Boolean(item)} title={t("addPromise")} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={async (event) => {
        event.preventDefault();
        if (!item) return;
        try {
          await getApi().collections.createPromise({ customerId: item.customerId, amount: paisaToMoneyString(parseMoneyToPaisa(amount)), promiseDate: date, channel: "call" });
          await client.invalidateQueries({ queryKey: ["promises"] });
          toast(t("saved"));
          onClose();
        } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
      }}>
        <Field label={t("promiseAmount")} error={error}><TextInput value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></Field>
        <Field label={t("promiseDate")}><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
        <Button type="submit">{t("addPromise")}</Button>
      </form>
    </Dialog>
  );
}

function HandoverPanel({ rows, onChange }: { rows: { id: string; collectorName: string; declaredAmount: string; cashCollected: string; status: string; variance?: string }[]; onChange: () => void }) {
  const t = useTranslations("collections");
  const errors = useTranslations("errors");
  const [declared, setDeclared] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <form className="rounded-2xl border border-line bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        try {
          await getApi().collections.submitHandover({ date: businessToday(), declaredAmount: paisaToMoneyString(parseMoneyToPaisa(declared)), note });
          onChange();
        } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
      }}>
        <Field label={t("declare")} error={error}><TextInput value={declared} onChange={(event) => setDeclared(event.target.value)} /></Field>
        <Field label={t("variance")}><TextArea value={note} onChange={(event) => setNote(event.target.value)} /></Field>
        <Button className="mt-3" type="submit">{t("confirm")}</Button>
      </form>
      {rows.map((row) => (
        <article key={row.id} className="rounded-2xl border border-line bg-white p-4">
          <p className="font-semibold">{row.collectorName}</p>
          <p>{t("declare")}: <Money value={row.declaredAmount} /></p>
          <p>{t("variance")}: {row.variance ? <Money value={row.variance} /> : "—"}</p>
          {row.status === "Submitted" ? (
            <Button className="mt-2" onClick={async () => {
              const noteText = row.variance && parseMoneyToPaisa(row.variance) !== 0 ? note || "মিলিয়ে নেওয়া হয়েছে" : undefined;
              try {
                await getApi().collections.confirmHandover(row.id, { confirmedAmount: row.declaredAmount, note: noteText });
                onChange();
              } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
            }}>{t("confirm")}</Button>
          ) : <Badge tone="ok">{row.status}</Badge>}
        </article>
      ))}
    </div>
  );
}
