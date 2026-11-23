"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { getApi } from "@/lib/api";
import { addDays, businessToday, formatDate } from "@/lib/date";
import { parseMoneyToPaisa } from "@/lib/money";

const COLORS = ["#0F766E", "#D97706", "#C2410C", "#BA1A1A"];

export function ReportsScreen() {
  const t = useTranslations("reports");
  const buckets = useTranslations("buckets");
  const locale = useLocale() === "en" ? "en" : "bn";
  const [range, setRange] = useState<"7" | "30">("7");
  const today = businessToday();
  const from = addDays(today, range === "7" ? -6 : -29);
  const aging = useQuery({ queryKey: ["aging"], queryFn: () => getApi().reports.aging() });
  const collections = useQuery({ queryKey: ["report-collections", from], queryFn: () => getApi().reports.collections({ from, to: today }) });
  const collectors = useQuery({ queryKey: ["report-collectors", from], queryFn: () => getApi().reports.collectors({ from, to: today }) });
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => getApi().reports.summary() });
  const [tab, setTab] = useState<"aging" | "byDate" | "byCollector">("aging");

  async function download(report: "dues" | "collections" | "aging") {
    const csv = await getApi().reports.exportCsv(report);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const pie = (aging.data?.buckets ?? []).map((bucket) => ({ name: buckets(bucket.key), paisa: parseMoneyToPaisa(bucket.amount) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted">{t("subtitle", { business: summary.data?.businessName ?? "" })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>{t("pdf")}</Button>
          <Button variant="outline" data-testid="export-csv" onClick={() => download(tab === "aging" ? "aging" : "collections")}>{t("excel")}</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["aging", "byDate", "byCollector"] as const).map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-2 text-sm font-semibold ${tab === item ? "bg-primary text-white" : "bg-white"}`} onClick={() => setTab(item)}>{t(item)}</button>
        ))}
        <button type="button" className="rounded-full bg-white px-3 py-2 text-sm font-semibold" onClick={() => setRange(range === "7" ? "30" : "7")}>{range === "7" ? t("last7") : t("last30")}</button>
      </div>
      {tab === "aging" && aging.data ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 rounded-2xl border border-line bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="paisa" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pie.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="rounded-2xl border border-line bg-white p-4">
            {aging.data.buckets.map((bucket) => (
              <li key={bucket.key} className="flex items-center justify-between border-b border-line py-2">
                <span>{buckets(bucket.key)} · {bucket.customers}</span>
                <Money value={bucket.amount} />
              </li>
            ))}
            <li className="flex justify-between pt-3 font-semibold"><span>{t("total")}</span><Money value={summary.data?.receivable ?? "0.00"} /></li>
          </ul>
        </section>
      ) : null}
      {tab === "byDate" ? (
        <table className="w-full overflow-hidden rounded-2xl bg-white text-left text-sm">
          <thead className="text-muted"><tr><th className="px-4 py-2">{t("date")}</th><th className="px-4 py-2">{t("txCount")}</th><th className="px-4 py-2">{t("collected")}</th></tr></thead>
          <tbody>
            {(collections.data ?? []).map((row) => (
              <tr key={row.date} className="border-t border-line"><td className="px-4 py-2">{formatDate(row.date, locale)}</td><td className="px-4 py-2">{row.count}</td><td className="px-4 py-2"><Money value={row.amount} tone="paid" /></td></tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {tab === "byCollector" ? (
        <table className="w-full rounded-2xl bg-white text-left text-sm">
          <thead className="text-muted"><tr><th className="px-4 py-2">{t("collector")}</th><th className="px-4 py-2">{t("count")}</th><th className="px-4 py-2">{t("collected")}</th></tr></thead>
          <tbody>
            {(collectors.data ?? []).map((row) => (
              <tr key={row.collectorId} className="border-t border-line"><td className="px-4 py-2">{row.name}</td><td className="px-4 py-2">{row.count}</td><td className="px-4 py-2"><Money value={row.amount} /></td></tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
