"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getApi } from "@/lib/api";
import { formatDate, formatDateShort, weekdayShort } from "@/lib/date";
import { formatBDT, parseMoneyToPaisa, toBnDigits } from "@/lib/money";
import { formatPhone } from "@/lib/phone";

const AGING_COLORS = ["#0F766E", "#D97706", "#C2410C", "#BA1A1A"];

export function DashboardScreen() {
  const t = useTranslations("dashboard");
  const buckets = useTranslations("buckets");
  const common = useTranslations("common");
  const planText = useTranslations("plan");
  const locale = useLocale() === "en" ? "en" : "bn";
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => getApi().reports.summary() });
  const aging = useQuery({ queryKey: ["aging"], queryFn: () => getApi().reports.aging() });
  const trends = useQuery({ queryKey: ["trends"], queryFn: () => getApi().reports.trends() });
  const today = useQuery({ queryKey: ["collect-today"], queryFn: () => getApi().collections.today() });
  const plan = useQuery({ queryKey: ["subscription"], queryFn: () => getApi().settings.subscription() });

  if (!summary.data || !aging.data || !trends.data) return <p className="text-muted">{common("loading")}</p>;

  const chart = trends.data.map((point) => ({
    label: `${weekdayShort(point.date, locale)} ${formatDateShort(point.date, locale)}`,
    paisa: parseMoneyToPaisa(point.amount),
  }));

  return (
    <div className="flex flex-col gap-5">
      {plan.data?.showExpiryBanner ? (
        <Link href="/plan" className="rounded-2xl bg-amber-soft px-4 py-3 text-sm font-semibold text-amber">
          {plan.data.status === "PastDue" ? planText("pastDue") : planText("trial", { days: plan.data.daysLeft ?? 0 })}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted">{summary.data.businessName} · {formatDate(summary.data.businessDate, locale)}</p>
        </div>
        <Link href="/collections" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-white">{t("receive")}</Link>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("totalReceivable")} value={summary.data.receivable} tone="due" />
        <Stat label={t("totalPayable")} value={summary.data.payable} tone="ink" />
        <Stat label={t("collectedToday")} value={summary.data.collectedToday} tone="paid" />
        <Stat label={t("overdue")} value={summary.data.overdue} tone="overdue" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">{t("trend")}</h2>
          <p className="text-sm text-muted">{t("trendHint")}</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                <YAxis hide />
                <Tooltip formatter={(value) => [formatTip(Number(value), locale), ""]} />
                <Bar dataKey="paisa" name={t("collectedToday")} radius={[8, 8, 0, 0]} fill="#0F766E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">{t("aging")}</h2>
          <p className="text-sm text-muted">{t("agingHint")}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {aging.data.buckets.map((bucket, index) => {
              const total = parseMoneyToPaisa(summary.data.receivable);
              const amount = parseMoneyToPaisa(bucket.amount);
              const width = total > 0 ? Math.max(4, Math.round((amount / total) * 100)) : 0;
              return (
                <li key={bucket.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{buckets(bucket.key)}</span>
                    <Money value={bucket.amount} />
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, background: AGING_COLORS[index] }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
      <section className="rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-semibold">{t("todayDues")}</h2>
          <Link href="/customers" className="text-sm font-semibold text-primary">{t("seeAll")}</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">{t("customer")}</th>
                <th className="px-4 py-2 font-medium">{t("dueAmount")}</th>
                <th className="px-4 py-2 font-medium">{t("overdueCol")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {(today.data ?? []).map((row) => (
                <tr key={row.customerId} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-muted">{row.area} · {formatPhone(row.phoneE164, locale)}</p>
                  </td>
                  <td className="px-4 py-3"><Money value={row.balance} tone="due" /></td>
                  <td className="px-4 py-3">
                    {row.dpd && row.dpd > 0 ? <Badge tone="danger">{common("overdueDays", { count: locale === "bn" ? toBnDigits(String(row.dpd)) : row.dpd })}</Badge> : <Badge tone="amber">{common("dueToday")}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/customers/${row.customerId}?tab=ledger`} className="font-semibold text-primary">{t("remind")}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "due" | "ink" | "paid" | "overdue" }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl"><Money value={value} tone={tone} className="text-2xl" /></p>
    </article>
  );
}

function formatTip(paisa: number, locale: "bn" | "en") {
  return formatBDT(paisa, { locale });
}
