"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/components/auth-provider";
import { Money } from "@/components/money";
import { Badge, Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { getApi, isApiError } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { errorCode } from "@/lib/errors";
import { paisaToMoneyString, parseMoneyToPaisa, toBnDigits } from "@/lib/money";
import { can } from "@/lib/permissions";
import { formatPhone } from "@/lib/phone";
import type { Customer, CustomerInput } from "@/lib/api/types";

export function CustomersScreen() {
  return <PartyList kind="customer" />;
}

export function SuppliersScreen() {
  return <PartyList kind="supplier" />;
}

function PartyList({ kind }: { kind: "customer" | "supplier" }) {
  const t = useTranslations(kind === "customer" ? "customers" : "suppliers");
  const customerText = useTranslations("customers");
  const common = useTranslations("common");
  const locale = useLocale() === "en" ? "en" : "bn";
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "overdue" | "due" | "settled">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [bulk, setBulk] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const query = useQuery({
    queryKey: [kind, debounced, filter, page],
    queryFn: () =>
      kind === "customer"
        ? getApi().customers.list({ search: debounced, filter, page, pageSize: 20 })
        : getApi().suppliers.list({ search: debounced, page, pageSize: 20 }),
  });
  const business = user?.memberships.find((item) => item.tenantId === user.currentTenantId);
  const rows = query.data?.items ?? [];
  const columns = useMemo<LegacyColumnDef<Customer>[]>(
    () => [
      {
        id: "pick",
        header: "",
        cell: ({ row }) =>
          kind === "customer" ? (
            <input
              type="checkbox"
              checked={selected.includes(row.original.id)}
              onChange={() =>
                setSelected((current) =>
                  current.includes(row.original.id) ? current.filter((id) => id !== row.original.id) : [...current, row.original.id],
                )
              }
            />
          ) : null,
      },
      {
        id: "name",
        header: common("name"),
        cell: ({ row }) => (
          <div>
            <Link href={`/${kind === "customer" ? "customers" : "suppliers"}/${row.original.id}`} className="font-semibold hover:text-primary">
              {locale === "en" && row.original.nameEn ? row.original.nameEn : row.original.name}
            </Link>
            <p className="text-xs text-muted">{row.original.area}</p>
          </div>
        ),
      },
      {
        id: "phone",
        header: kind === "customer" ? t("phone") : common("phone"),
        cell: ({ row }) => formatPhone(row.original.phoneE164, locale),
      },
      {
        id: "balance",
        header: t("balance"),
        cell: ({ row }) => <Balance customer={row.original} payable={kind === "supplier" ? common("payable") : undefined} />,
      },
      ...(kind === "customer"
        ? ([
            {
              id: "last",
              header: t("lastPayment"),
              cell: ({ row }) => (row.original.lastPaymentDate ? formatDate(row.original.lastPaymentDate, locale) : "—"),
            },
            {
              id: "due",
              header: t("dueDate"),
              cell: ({ row }) => <DueBadge customer={row.original} />,
            },
          ] as LegacyColumnDef<Customer>[])
        : []),
    ],
    [common, kind, locale, selected, t],
  );
  const table = useLegacyTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const canWrite = can(user?.role, "customers.write") || can(user?.role, "customers.editLimited");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted">{t("subtitle", { business: locale === "en" ? business?.tenantName ?? "" : business?.tenantNameBn ?? "", count: query.data?.totalCount ?? 0 })}</p>
        </div>
        {canWrite ? <Button data-testid={`${kind}-add`} onClick={() => { setEditing(null); setFormKey((value) => value + 1); setOpen(true); }}>{t("add")}</Button> : null}
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <TextInput data-testid="party-search" placeholder={kind === "customer" ? customerText("search") : common("search")} value={search} onChange={(event) => setSearch(event.target.value)} className="md:max-w-sm" />
        {kind === "customer" ? (
          <div className="flex flex-wrap gap-2">
            {(["all", "overdue", "due", "settled"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-sm font-semibold ${filter === item ? "bg-primary text-white" : "bg-white text-muted"}`}>
                {item === "all" ? common("all") : item === "overdue" ? t("overdue") : item === "due" ? t("due") : t("settled")}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {selected.length > 0 && kind === "customer" ? (
        <div className="flex items-center justify-between rounded-2xl bg-mint px-4 py-3">
          <p className="font-semibold">{t("selected", { count: selected.length })}</p>
          <Button onClick={() => setBulk(true)}>{t("bulkRemind")}</Button>
        </div>
      ) : null}
      {query.isLoading ? <div data-testid="party-skeleton" className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-muted">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-3 py-3 font-medium">{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !query.isLoading ? <p className="p-6 text-muted">{t("empty")}</p> : null}
        {(query.data?.totalPages ?? 1) > 1 ? (
          <div className="flex justify-end gap-2 p-3">
            <Button variant="outline" className="min-h-10" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{common("back")}</Button>
            <Button variant="outline" className="min-h-10" disabled={page >= (query.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}>{page}</Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <Link key={row.id} href={`/${kind === "customer" ? "customers" : "suppliers"}/${row.id}`} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-muted">{formatPhone(row.phoneE164, locale)} · {row.area}</p>
              </div>
              <Balance customer={row} payable={kind === "supplier" ? common("payable") : undefined} />
            </div>
            {kind === "customer" ? <div className="mt-2"><DueBadge customer={row} /></div> : null}
          </Link>
        ))}
      </div>
      <PartyDialog key={formKey} kind={kind} open={open} customer={editing} onClose={() => setOpen(false)} />
      {bulk ? <BulkDialog ids={selected} onClose={() => { setBulk(false); setSelected([]); }} /> : null}
    </div>
  );
}

function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), 300);
    return () => window.clearTimeout(timer);
  }, [value]);
  return debounced;
}

function Balance({ customer, payable }: { customer: Customer; payable?: string }) {
  const common = useTranslations("common");
  const paisa = parseMoneyToPaisa(customer.balance);
  if (payable && paisa < 0) {
    return (
      <span>
        <span className="mr-1 text-xs font-semibold text-danger">{payable}</span>
        <Money value={customer.balance} tone="due" absolute />
      </span>
    );
  }
  if (paisa < 0) return <span className="text-primary"><Money value={customer.balance} tone="paid" absolute /> <span className="text-xs">{common("advance")}</span></span>;
  if (paisa === 0) return <span className="text-sm text-muted">{common("settled")}</span>;
  return (
    <span>
      {payable ? <span className="mr-1 text-xs font-semibold text-danger">{payable}</span> : null}
      <Money value={customer.balance} tone={customer.status === "overdue" ? "overdue" : "due"} />
    </span>
  );
}

function DueBadge({ customer }: { customer: Customer }) {
  const common = useTranslations("common");
  const locale = useLocale() === "en" ? "en" : "bn";
  if (customer.status === "advance") return <Badge tone="ok">{common("advance")}</Badge>;
  if (customer.status === "settled") return <Badge tone="mint">{common("settled")}</Badge>;
  if (customer.status === "overdue" && customer.dpd) return <Badge tone="danger">{common("overdueDays", { count: locale === "bn" ? toBnDigits(String(customer.dpd)) : customer.dpd })}</Badge>;
  if (customer.status === "dueToday") return <Badge tone="amber">{common("dueToday")}</Badge>;
  return <span className="text-sm text-muted">{customer.nextDueDate ? formatDate(customer.nextDueDate, locale) : "—"}</span>;
}

const partySchema = z.object({
  name: z.string().trim().min(1, "REQUIRED"),
  phone: z.string().trim().min(10, "PHONE_INVALID"),
  creditDays: z.string().regex(/^\d+$/, "REQUIRED"),
});

function PartyDialog({ kind, open, customer, onClose }: { kind: "customer" | "supplier"; open: boolean; customer: Customer | null; onClose: () => void }) {
  const t = useTranslations(kind === "customer" ? "customers" : "suppliers");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const toast = useToast();
  const client = useQueryClient();
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phoneE164 ?? "");
  const [area, setArea] = useState(customer?.area ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [creditDays, setCreditDays] = useState(String(customer?.creditDays ?? 7));
  const [opening, setOpening] = useState("");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async () => {
      const parsed = partySchema.safeParse({ name, phone, creditDays });
      if (!parsed.success) {
        const mapped: Record<string, string> = {};
        for (const issue of parsed.error.issues) mapped[String(issue.path[0] ?? "form")] = errors(issue.message as "REQUIRED");
        setFieldErrors(mapped);
        throw new Error("VALIDATION");
      }
      const body: CustomerInput = {
        name,
        phone,
        area,
        address,
        creditDays: Number(creditDays) || 7,
        notes,
        openingBalance: opening ? paisaToMoneyString(parseMoneyToPaisa(opening)) : undefined,
      };
      if (customer) return kind === "customer" ? getApi().customers.update(customer.id, body, customer.rowVersion) : getApi().suppliers.update(customer.id, body, customer.rowVersion);
      return kind === "customer" ? getApi().customers.create(body) : getApi().suppliers.create(body);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: [kind] });
      toast(t("saved"));
      onClose();
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "VALIDATION") return;
      if (isApiError(error) && error.errors) {
        const mapped: Record<string, string> = {};
        for (const [field, codes] of Object.entries(error.errors)) {
          mapped[field] = errors((codes[0] ?? "UNKNOWN").replaceAll(".", "_").replaceAll("-", "_") as "UNKNOWN");
        }
        setFieldErrors(mapped);
        return;
      }
      setFieldErrors({ form: errors(errorCode(error) as "UNKNOWN") });
    },
  });

  return (
    <Dialog open={open} title={customer ? t("edit") : t("add")} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <Field label={common("name")} error={fieldErrors.name ?? fieldErrors.form}><TextInput data-testid="party-name" value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label={common("phone")} error={fieldErrors.phone}><TextInput data-testid="party-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
        <Field label={kind === "customer" ? t("area") : common("name")}><TextInput value={area} onChange={(event) => setArea(event.target.value)} /></Field>
        <Field label={kind === "customer" ? t("address") : common("note")}><TextInput value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
        <Field label={kind === "customer" ? t("creditDays") : common("date")}><TextInput value={creditDays} onChange={(event) => setCreditDays(event.target.value)} inputMode="numeric" /></Field>
        {!customer ? <Field label={kind === "customer" ? t("opening") : common("amount")}><TextInput data-testid="party-opening" value={opening} onChange={(event) => setOpening(event.target.value)} inputMode="decimal" /></Field> : null}
        <Field label={common("note")}><TextArea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <Button data-testid="party-save" type="submit" disabled={save.isPending}>{common("save")}</Button>
      </form>
    </Dialog>
  );
}

function BulkDialog({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const t = useTranslations("reminders");
  const toast = useToast();
  const templates = useQuery({ queryKey: ["templates", "bn"], queryFn: () => getApi().reminders.templates({ language: "bn", channel: "Sms" }) });
  const template = useMemo(() => templates.data?.find((item) => item.key === "ReminderDue") ?? templates.data?.[0], [templates.data]);
  const preview = useQuery({
    queryKey: ["bulk", ids.join(","), template?.id],
    queryFn: () => getApi().reminders.bulkPreview({ customerIds: ids, templateId: template!.id, channel: "Sms" }),
    enabled: Boolean(template),
  });
  return (
    <Dialog open title={t("bulkTitle")} onClose={onClose}>
      <p className="text-lg font-semibold">{preview.data ? t("bulkConfirm", { count: preview.data.recipientCount, cost: preview.data.estimatedCost }) : "…"}</p>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
        {preview.data?.samples.map((sample) => <li key={sample.name}><span className="font-semibold text-ink">{sample.name}: </span>{sample.text}</li>)}
      </ul>
      <Button className="mt-4" data-testid="bulk-send" onClick={async () => {
        if (!template) return;
        await getApi().reminders.bulkSend({ customerIds: ids, templateId: template.id, channel: "Sms" }, crypto.randomUUID());
        toast(t("sent"));
        onClose();
      }}>{t("confirmSend")}</Button>
    </Dialog>
  );
}
