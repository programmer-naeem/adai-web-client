"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Money } from "@/components/money";
import { Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getApi } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { paisaToMoneyString, parseMoneyToPaisa } from "@/lib/money";

export function WalletScreen() {
  const t = useTranslations("wallet");
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getApi().reminders.wallet() });
  const tx = useQuery({ queryKey: ["wallet-tx"], queryFn: () => getApi().reminders.walletTransactions() });
  const toast = useToast();
  const client = useQueryClient();
  const [threshold, setThreshold] = useState("");
  if (!wallet.data) return null;
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {wallet.data.low ? <p className="rounded-2xl bg-amber-soft px-4 py-3 font-semibold text-amber">{t("low")}</p> : null}
      <p className="text-sm text-muted">{t("balance")}</p>
      <p className="text-4xl"><Money value={wallet.data.balance} tone={wallet.data.low ? "overdue" : "paid"} /></p>
      <form className="flex gap-2" onSubmit={async (event) => {
        event.preventDefault();
        await getApi().reminders.setThreshold(paisaToMoneyString(parseMoneyToPaisa(threshold)));
        await client.invalidateQueries({ queryKey: ["wallet"] });
        toast(t("saved"));
      }}>
        <TextInput placeholder={t("threshold")} value={threshold} onChange={(event) => setThreshold(event.target.value)} />
        <Button type="submit">{t("saved")}</Button>
      </form>
      <h2 className="font-semibold">{t("history")}</h2>
      <ul className="flex flex-col gap-2">
        {(tx.data ?? []).map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-white p-3 text-sm">
            <div className="flex justify-between"><span>{item.note}</span><Money value={item.amount} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AuditScreen() {
  const t = useTranslations("audit");
  const locale = useLocale() === "en" ? "en" : "bn";
  const rows = useQuery({ queryKey: ["audit"], queryFn: () => getApi().audit.list() });
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <ul className="mt-4 flex flex-col gap-3">
        {(rows.data ?? []).map((row) => (
          <li key={row.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">{formatDate(row.atUtc.slice(0, 10), locale)} · {row.actorName}</p>
            <p className="font-semibold">{row.action} · {row.entityType}</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <pre className="overflow-auto rounded-xl bg-canvas p-3 text-xs">{t("before")}: {JSON.stringify(row.before ?? {}, null, 2)}</pre>
              <pre className="overflow-auto rounded-xl bg-mint p-3 text-xs">{t("after")}: {JSON.stringify(row.after ?? {}, null, 2)}</pre>
            </div>
          </li>
        ))}
        {(rows.data ?? []).length === 0 ? <p className="text-muted">{t("empty")}</p> : null}
      </ul>
    </div>
  );
}

export function PlanScreen() {
  const t = useTranslations("plan");
  const info = useQuery({ queryKey: ["subscription"], queryFn: () => getApi().settings.subscription() });
  const toast = useToast();
  const client = useQueryClient();
  if (!info.data) return null;
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {info.data.showExpiryBanner ? (
        <p className="rounded-2xl bg-amber-soft px-4 py-3 font-semibold text-amber">
          {info.data.status === "PastDue" ? t("pastDue") : t("trial", { days: info.data.daysLeft ?? 0 })}
        </p>
      ) : <p className="rounded-2xl bg-mint px-4 py-3 font-semibold text-primary">{t("active")}</p>}
      <p>{info.data.planName} · {t("usage", { count: info.data.customerCount, max: info.data.maxCustomers })}</p>
      <Button data-testid="mark-paid" onClick={async () => {
        await getApi().settings.recordManualPayment();
        await client.invalidateQueries({ queryKey: ["subscription"] });
        toast(t("paid"));
      }}>{t("markPaid")}</Button>
      <p className="text-sm text-muted">{t("placeholder")}</p>
    </div>
  );
}

export function ImportScreen() {
  const t = useTranslations("import");
  const toast = useToast();
  const [csv, setCsv] = useState("Name,Phone,Type,OpeningBalance\nটেস্ট কাস্টমার,01710000099,Customer,1000");
  const [id, setId] = useState("");
  const [valid, setValid] = useState(0);
  const [errors, setErrors] = useState(0);
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted">{t("hint")}</p>
      <Field label={t("paste")}><TextArea data-testid="import-csv" value={csv} onChange={(event) => setCsv(event.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button onClick={async () => {
          const preview = await getApi().settings.importPreview(csv);
          setId(preview.id);
          setValid(preview.validRows);
          setErrors(preview.errors.length);
        }}>{t("check")}</Button>
        <Button variant="outline" disabled={!id} onClick={async () => {
          const result = await getApi().settings.importCommit(id);
          toast(t("done", { count: result.created }));
        }}>{t("commit")}</Button>
        <Button variant="ghost" disabled={!id || errors === 0} onClick={async () => {
          const report = await getApi().settings.importErrorReport(id);
          const blob = new Blob([report], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "import-errors.csv";
          link.click();
        }}>{t("download")}</Button>
      </div>
      {id ? <p>{t("valid", { count: valid })} · {t("errors", { count: errors })}</p> : null}
    </div>
  );
}

export function StatementScreen({ token }: { token: string }) {
  const t = useTranslations("statement");
  const toast = useToast();
  const statement = useQuery({ queryKey: ["statement", token], queryFn: () => getApi().statements.publicGet(token) });
  if (statement.isError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("missing")}</h1>
        <p className="mt-2 text-muted">{t("missingHint")}</p>
      </main>
    );
  }
  if (!statement.data) return <p className="p-8">{t("title")}</p>;
  const data = statement.data;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-8">
      <p className="text-sm font-semibold text-primary">{data.businessName}</p>
      <h1 className="text-3xl font-bold">{data.customerName}</h1>
      <p className="text-muted">{data.maskedPhone}</p>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-muted">{t("balance")}</p>
        <p className="text-4xl"><Money value={data.balance} tone="due" /></p>
        <p className="mt-2 text-sm">{t("overdue")}: <Money value={data.overdue} tone="overdue" /></p>
      </section>
      <h2 className="font-semibold">{t("recent")}</h2>
      <ul className="flex flex-col gap-2">
        {data.entries.map((entry, index) => (
          <li key={index} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
            <span>{formatDate(entry.date, data.language)} · {entry.label}</span>
            <Money value={entry.amount} tone={entry.direction === "Dr" ? "due" : "paid"} />
          </li>
        ))}
      </ul>
      <a className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary font-semibold text-white" href={`tel:${data.businessPhone}`}>{t("call")}</a>
      <Button variant="outline" onClick={() => window.print()}>{t("pdf")}</Button>
      <Button variant="ghost" onClick={async () => { await getApi().statements.optOut(token); toast(t("stopped")); }}>{t("stop")}</Button>
    </main>
  );
}
