"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Money } from "@/components/money";
import { Badge, Button, Field, TextInput } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Link, usePathname } from "@/i18n/navigation";
import { getApi } from "@/lib/api";
import type { AdminPlan, SubscriptionStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { errorCode } from "@/lib/errors";
import { groupLakh, paisaToMoneyString, parseMoneyToPaisa, toBnDigits } from "@/lib/money";

const STATUSES: SubscriptionStatus[] = ["Trial", "Active", "PastDue", "Suspended", "Cancelled"];

const moneyField = z.string().trim().regex(/^\d+(\.\d{1,2})?$/);
const planSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  nameBn: z.string().trim().min(1),
  monthlyPrice: moneyField,
  maxCustomers: z.string().trim().regex(/^[1-9]\d*$/),
  includedCredits: moneyField,
});
const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(1),
  nameBn: z.string().trim().min(1),
});
const tenantSchema = z.object({
  name: z.string().trim().min(1),
  nameBn: z.string().trim().min(1),
  phone: z.string().trim().min(10),
  ownerName: z.string().trim().min(1),
  planId: z.string().min(1),
  address: z.string().optional(),
});

export function AdminNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const items = [
    { href: "/admin/tenants", label: t("tenants") },
    { href: "/admin/plans", label: t("plans") },
    { href: "/admin/rates", label: t("rates") },
    { href: "/admin/holidays", label: t("holidays") },
    { href: "/admin/invoices", label: t("invoices") },
  ];
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={t("section")}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold",
            pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-primary text-white" : "bg-white text-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function useLocaleCode() {
  return useLocale() === "en" ? "en" : "bn";
}

function countLabel(value: number, locale: "bn" | "en") {
  const grouped = groupLakh(String(value));
  return locale === "bn" ? toBnDigits(grouped) : grouped;
}

export function AdminTenantsScreen() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const status = useTranslations("status");
  const locale = useLocaleCode();
  const toast = useToast();
  const client = useQueryClient();
  const rows = useQuery({ queryKey: ["admin-tenants"], queryFn: () => getApi().admin.tenants() });
  const plans = useQuery({ queryKey: ["admin-plans"], queryFn: () => getApi().admin.plans() });
  const form = useForm({ defaultValues: { name: "", nameBn: "", phone: "", ownerName: "", planId: "", address: "" } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("tenants")}</h1>
      <form
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          const parsed = tenantSchema.safeParse(values);
          if (!parsed.success) {
            toast(errors("REQUIRED"), "danger");
            return;
          }
          try {
            await getApi().admin.createTenant(parsed.data);
            form.reset();
            await client.invalidateQueries({ queryKey: ["admin-tenants"] });
            toast(t("saved"));
          } catch (error) {
            toast(errors(errorCode(error) as "UNKNOWN"), "danger");
          }
        })}
      >
        <h2 className="font-semibold md:col-span-2">{t("createTenant")}</h2>
        <Field label={t("nameBn")}><TextInput {...form.register("nameBn")} /></Field>
        <Field label={t("nameEn")}><TextInput {...form.register("name")} /></Field>
        <Field label={common("phone")}><TextInput {...form.register("phone")} inputMode="tel" /></Field>
        <Field label={t("ownerName")}><TextInput {...form.register("ownerName")} /></Field>
        <Field label={common("address")}><TextInput {...form.register("address")} /></Field>
        <Field label={t("plans")}>
          <select className="h-12 w-full rounded-xl border border-line px-3" {...form.register("planId")}>
            <option value="">{common("all")}</option>
            {(plans.data ?? []).map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.nameBn}</option>
            ))}
          </select>
        </Field>
        <Button type="submit" className="md:col-span-2">{t("add")}</Button>
      </form>
      <ul className="flex flex-col gap-3">
        {(rows.data ?? []).map((row) => (
          <li key={row.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/admin/tenants/${row.id}`} className="text-lg font-semibold">{row.nameBn}</Link>
                <p className="text-sm text-muted">{row.name}</p>
              </div>
              <Badge tone={row.status === "Suspended" || row.status === "Cancelled" ? "danger" : row.status === "PastDue" ? "amber" : "ok"}>{status(row.status)}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{t("owner")}: {row.ownerName} · {row.planName}</p>
            <p className="text-sm">{t("customers")}: {countLabel(row.customerCount, locale)} · <Money value={row.walletBalance} /></p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminTenantScreen({ id }: { id: string }) {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const statusText = useTranslations("status");
  const locale = useLocaleCode();
  const toast = useToast();
  const client = useQueryClient();
  const detail = useQuery({ queryKey: ["admin-tenant", id], queryFn: () => getApi().admin.tenant(id) });
  const plans = useQuery({ queryKey: ["admin-plans"], queryFn: () => getApi().admin.plans() });
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  if (!detail.data) return <p className="text-muted">{common("loading")}</p>;
  const shop = detail.data;
  const currentStatus = status || shop.status;
  const currentPlan = planId || shop.planId;

  async function refresh() {
    await client.invalidateQueries({ queryKey: ["admin-tenant", id] });
    await client.invalidateQueries({ queryKey: ["admin-invoices"] });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Link href="/admin/tenants" className="text-sm font-semibold text-primary">{common("back")}</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{shop.nameBn}</h1>
          <p className="text-sm text-muted">{shop.name} · {shop.phoneE164}</p>
          <p className="text-sm text-muted">{shop.address}</p>
        </div>
        <Badge>{statusText(shop.status)}</Badge>
      </div>
      <p className="text-sm">{t("owner")}: {shop.ownerName} · {t("customers")}: {countLabel(shop.customerCount, locale)} / {countLabel(shop.maxCustomers, locale)}</p>
      {shop.trialEndsOn ? <p className="text-sm text-muted">{t("trialEnds")}: {formatDate(shop.trialEndsOn, locale)}</p> : null}
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{common("status")}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select className="h-12 flex-1 rounded-xl border border-line px-3" value={currentStatus} onChange={(event) => setStatus(event.target.value as SubscriptionStatus)} aria-label={common("status")}>
            {STATUSES.map((item) => <option key={item} value={item}>{statusText(item)}</option>)}
          </select>
          <Button onClick={async () => { await getApi().admin.setStatus(id, currentStatus); await refresh(); toast(t("saved")); }}>{t("saveStatus")}</Button>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{t("subscription")}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select className="h-12 flex-1 rounded-xl border border-line px-3" value={currentPlan} onChange={(event) => setPlanId(event.target.value)} aria-label={t("plans")}>
            {(plans.data ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.nameBn}</option>)}
          </select>
          <Button onClick={async () => { await getApi().admin.setSubscription(id, currentPlan); setPlanId(""); await refresh(); toast(t("saved")); }}>{t("savePlan")}</Button>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{t("walletBalance")}</h2>
        <p className="text-3xl"><Money value={shop.walletBalance} tone="paid" /></p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await getApi().admin.topUpWallet(id, paisaToMoneyString(parseMoneyToPaisa(amount)));
            setAmount("");
            await refresh();
            toast(t("saved"));
          } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
        }}>
          <TextInput value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={common("amount")} aria-label={common("amount")} inputMode="decimal" />
          <Button type="submit">{t("topUp")}</Button>
        </form>
      </section>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{t("invoices")}</h2>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await getApi().admin.createInvoice(id, { amount: paisaToMoneyString(parseMoneyToPaisa(invoiceAmount)) });
            setInvoiceAmount("");
            await refresh();
            toast(t("saved"));
          } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
        }}>
          <TextInput value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} placeholder={common("amount")} aria-label={common("amount")} inputMode="decimal" />
          <Button type="submit">{t("createInvoice")}</Button>
        </form>
        <ul className="mt-4 flex flex-col gap-3">
          {shop.invoices.map((invoice) => (
            <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <div>
                <p className="font-semibold">{invoice.number} · <Money value={invoice.amount} /></p>
                <p className="text-sm text-muted">{t("issued")}: {formatDate(invoice.issuedOn, locale)}{invoice.paidOn ? ` · ${t("paidOn")}: ${formatDate(invoice.paidOn, locale)}` : ""}</p>
              </div>
              {invoice.status === "Paid" ? <Badge tone="ok">{statusText("Paid")}</Badge> : (
                <Button onClick={async () => { await getApi().admin.markInvoicePaid(invoice.id); await refresh(); toast(t("saved")); }}>{t("markPaid")}</Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function AdminPlansScreen() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const locale = useLocaleCode();
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const plans = useQuery({ queryKey: ["admin-plans"], queryFn: () => getApi().admin.plans() });
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const form = useForm({ defaultValues: { code: "", name: "", nameBn: "", monthlyPrice: "", maxCustomers: "", includedCredits: "", isActive: true } });

  function edit(plan: AdminPlan) {
    setEditing(plan);
    form.reset({
      code: plan.code,
      name: plan.name,
      nameBn: plan.nameBn,
      monthlyPrice: plan.monthlyPrice,
      maxCustomers: String(plan.maxCustomers),
      includedCredits: plan.includedCredits,
      isActive: plan.isActive,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("plans")}</h1>
      <form className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-2" onSubmit={form.handleSubmit(async (values) => {
        const parsed = planSchema.safeParse(values);
        if (!parsed.success) { toast(errors("REQUIRED"), "danger"); return; }
        const body = { ...parsed.data, maxCustomers: Number(parsed.data.maxCustomers), isActive: values.isActive };
        try {
          if (editing) await getApi().admin.updatePlan(editing.id, body);
          else await getApi().admin.createPlan(body);
          setEditing(null);
          form.reset({ code: "", name: "", nameBn: "", monthlyPrice: "", maxCustomers: "", includedCredits: "", isActive: true });
          await client.invalidateQueries({ queryKey: ["admin-plans"] });
          toast(t("saved"));
        } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
      })}>
        <Field label={t("code")}><TextInput {...form.register("code")} /></Field>
        <Field label={t("nameEn")}><TextInput {...form.register("name")} /></Field>
        <Field label={t("nameBn")}><TextInput {...form.register("nameBn")} /></Field>
        <Field label={t("price")}><TextInput {...form.register("monthlyPrice")} inputMode="decimal" /></Field>
        <Field label={t("maxCustomers")}><TextInput {...form.register("maxCustomers")} inputMode="numeric" /></Field>
        <Field label={t("credits")}><TextInput {...form.register("includedCredits")} inputMode="decimal" /></Field>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" {...form.register("isActive")} /> {t("activePlan")}</label>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? common("save") : t("add")}</Button>
          {editing ? <Button type="button" variant="ghost" onClick={() => { setEditing(null); form.reset(); }}>{common("cancel")}</Button> : null}
        </div>
      </form>
      <ul className="flex flex-col gap-3">
        {(plans.data ?? []).map((plan) => (
          <li key={plan.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{plan.nameBn} · {plan.code}</p>
                <p className="text-sm text-muted">{plan.name}</p>
                <p className="mt-1 text-sm"><Money value={plan.monthlyPrice} /> · {t("maxCustomers")}: {countLabel(plan.maxCustomers, locale)} · {t("credits")}: <Money value={plan.includedCredits} /></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => edit(plan)}>{common("edit")}</Button>
                <Button variant="ghost" onClick={async () => {
                  try {
                    await getApi().admin.deletePlan(plan.id);
                    await client.invalidateQueries({ queryKey: ["admin-plans"] });
                  } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
                }}>{common("delete")}</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminRatesScreen() {
  const t = useTranslations("admin");
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const rates = useQuery({ queryKey: ["admin-rates"], queryFn: () => getApi().admin.channelRates() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("rates")}</h1>
      <ul className="flex flex-col gap-3">
        {(rates.data ?? []).map((rate) => (
          <li key={rate.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">{rate.channel === "Sms" ? t("sms") : t("whatsapp")}</p>
            <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={async (event) => {
              event.preventDefault();
              try {
                const value = drafts[rate.id] ?? rate.pricePerSegment;
                await getApi().admin.updateChannelRate(rate.id, paisaToMoneyString(parseMoneyToPaisa(value)));
                await client.invalidateQueries({ queryKey: ["admin-rates"] });
                toast(t("saved"));
              } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
            }}>
              <Field label={t("pricePerSegment")}>
                <TextInput value={drafts[rate.id] ?? rate.pricePerSegment} onChange={(event) => setDrafts((current) => ({ ...current, [rate.id]: event.target.value }))} inputMode="decimal" />
              </Field>
              <Button type="submit" className="sm:self-end">{t("saveStatus")}</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminHolidaysScreen() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const locale = useLocaleCode();
  const toast = useToast();
  const client = useQueryClient();
  const holidays = useQuery({ queryKey: ["admin-holidays"], queryFn: () => getApi().admin.holidays() });
  const form = useForm({ defaultValues: { date: "", name: "", nameBn: "" } });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("holidays")}</h1>
      <form className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3" onSubmit={form.handleSubmit(async (values) => {
        const parsed = holidaySchema.safeParse(values);
        if (!parsed.success) { toast(errors("DATE_INVALID"), "danger"); return; }
        try {
          await getApi().admin.createHoliday(parsed.data);
          form.reset();
          await client.invalidateQueries({ queryKey: ["admin-holidays"] });
          toast(t("saved"));
        } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
      })}>
        <Field label={common("date")}><TextInput type="date" {...form.register("date")} /></Field>
        <Field label={t("holidayName")}><TextInput {...form.register("name")} /></Field>
        <Field label={t("holidayNameBn")}><TextInput {...form.register("nameBn")} /></Field>
        <Button type="submit" className="md:col-span-3">{t("add")}</Button>
      </form>
      <ul className="flex flex-col gap-2">
        {(holidays.data ?? []).map((holiday) => (
          <li key={holiday.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3">
            <div>
              <p className="font-semibold">{locale === "en" ? holiday.name : holiday.nameBn}</p>
              <p className="text-sm text-muted">{formatDate(holiday.date, locale)}</p>
            </div>
            <Button variant="ghost" onClick={async () => { await getApi().admin.deleteHoliday(holiday.id); await client.invalidateQueries({ queryKey: ["admin-holidays"] }); }}>{common("delete")}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminInvoicesScreen() {
  const t = useTranslations("admin");
  const statusText = useTranslations("status");
  const locale = useLocaleCode();
  const toast = useToast();
  const client = useQueryClient();
  const invoices = useQuery({ queryKey: ["admin-invoices"], queryFn: () => getApi().admin.invoices() });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("invoices")}</h1>
      <ul className="flex flex-col gap-3">
        {(invoices.data ?? []).map((invoice) => (
          <li key={invoice.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{invoice.number}</p>
                <Link href={`/admin/tenants/${invoice.tenantId}`} className="text-sm font-semibold text-primary">{invoice.tenantName}</Link>
                <p className="text-sm text-muted">{t("issued")}: {formatDate(invoice.issuedOn, locale)}{invoice.paidOn ? ` · ${t("paidOn")}: ${formatDate(invoice.paidOn, locale)}` : ""}</p>
                {invoice.note ? <p className="text-sm">{invoice.note}</p> : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Money value={invoice.amount} />
                {invoice.status === "Paid" ? <Badge tone="ok">{statusText("Paid")}</Badge> : (
                  <Button onClick={async () => { await getApi().admin.markInvoicePaid(invoice.id); await client.invalidateQueries({ queryKey: ["admin-invoices"] }); toast(t("saved")); }}>{t("markPaid")}</Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
