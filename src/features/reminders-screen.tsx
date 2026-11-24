"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Money } from "@/components/money";
import { Button, Field, TextArea } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getApi } from "@/lib/api";
import { addDays, businessToday } from "@/lib/date";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/templates";
import type { MessageTemplate } from "@/lib/api/types";

export function RemindersScreen() {
  const t = useTranslations("reminders");
  const locale = useLocale() === "en" ? "en" : "bn";
  const { user } = useAuth();
  const business = user?.memberships.find((item) => item.tenantId === user.currentTenantId);
  const templates = useQuery({ queryKey: ["templates", locale], queryFn: () => getApi().reminders.templates({ language: locale }) });
  const rules = useQuery({ queryKey: ["rules"], queryFn: () => getApi().reminders.rules() });
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = templates.data?.find((item) => item.id === currentId) ?? templates.data?.[0];
  const tomorrow = addDays(businessToday(), 1);
  const simulate = useQuery({ queryKey: ["simulate", tomorrow], queryFn: () => getApi().reminders.simulate(tomorrow) });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle", { business: locale === "en" ? business?.tenantName ?? "" : business?.tenantNameBn ?? "" })}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-line bg-white p-2">
          {(templates.data ?? []).map((item) => (
            <button key={item.id} type="button" className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${current?.id === item.id ? "bg-mint text-primary" : ""}`} onClick={() => setCurrentId(item.id)}>
              {item.name}
              <span className="block text-xs font-normal text-muted">{item.channel}</span>
            </button>
          ))}
        </aside>
        {current ? <TemplateEditor key={current.id} template={current} /> : null}
      </div>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{t("rules")}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {(rules.data ?? []).map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2">
              <div>
                <p className="font-semibold">{rule.name}</p>
                <p className="text-sm text-muted">{rule.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={rule.isEnabled} onChange={async (event) => { await getApi().reminders.updateRule(rule.id, { isEnabled: event.target.checked }); await rules.refetch(); }} />
                  {rule.code}
                </label>
                <input className="h-10 w-20 rounded-lg border border-line px-2" type="number" defaultValue={rule.offsetDays} aria-label={t("days")} onBlur={async (event) => { await getApi().reminders.updateRule(rule.id, { offsetDays: Number(event.target.value) }); await rules.refetch(); }} />
                <select className="h-10 rounded-lg border border-line px-2" defaultValue={rule.templateKey} aria-label={t("templates")} onChange={async (event) => { await getApi().reminders.updateRule(rule.id, { templateKey: event.target.value }); await rules.refetch(); }}>
                  {(templates.data ?? []).map((item) => <option key={item.id} value={item.key}>{item.key}</option>)}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{t("simulate")}</h2>
        {(simulate.data ?? []).length === 0 ? <p className="mt-2 text-sm text-muted">{t("none")}</p> : (
          <ul className="mt-2 text-sm">{simulate.data?.map((row) => <li key={`${row.customerId}-${row.ruleCode}`}>{row.name} · {row.ruleCode}</li>)}</ul>
        )}
      </section>
    </div>
  );
}

function TemplateEditor({ template }: { template: MessageTemplate }) {
  const t = useTranslations("reminders");
  const toast = useToast();
  const client = useQueryClient();
  const [body, setBody] = useState(template.body);
  const preview = useQuery({
    queryKey: ["preview", template.id, body],
    queryFn: () => getApi().reminders.preview({ templateId: template.id, text: body, channel: template.channel }),
  });
  const shown = useMemo(() => body, [body]);
  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <h2 className="font-semibold">{template.name}</h2>
      <p className="text-sm text-muted">{t("variables")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TEMPLATE_PLACEHOLDERS.slice(0, 8).map((key) => (
          <button key={key} type="button" className="rounded-full bg-canvas px-2 py-1 text-xs font-semibold" onClick={() => setBody((value) => `${value} {{${key}}}`)}>{`{{${key}}}`}</button>
        ))}
      </div>
      <Field label={t("write")}>
        <TextArea data-testid="template-body" value={shown} onChange={(event) => setBody(event.target.value)} />
      </Field>
      <p className="mt-2 text-sm font-semibold text-muted" data-testid="segment-count">
        {t("chars", { count: preview.data?.length ?? 0 })} · {t("segments", { count: preview.data?.segments ?? 0 })}
        {preview.data ? ` · ${t("cost", { cost: preview.data.cost })} · ${preview.data.encoding}` : ""}
      </p>
      <div className="mt-3 rounded-xl bg-canvas p-3 text-sm">{preview.data?.text}</div>
      <Button className="mt-3" onClick={async () => {
        await getApi().reminders.updateTemplate(template.id, body);
        await client.invalidateQueries({ queryKey: ["templates"] });
        toast(t("sent"));
      }}>{t("write")}</Button>
    </section>
  );
}

export function MessagesScreen() {
  const t = useTranslations("reminders");
  const messages = useQuery({ queryKey: ["message-log"], queryFn: () => getApi().reminders.messages() });
  const client = useQueryClient();
  const toast = useToast();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("log")}</h1>
      <ul className="mt-4 flex flex-col gap-2">
        {(messages.data ?? []).map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{item.partyName} · {item.channel}</p>
              <span>{item.status}</span>
            </div>
            <p className="mt-1">{item.renderedBody}</p>
            <p className="mt-1"><Money value={item.cost} /></p>
            {item.status === "Failed" ? <Button className="mt-2" onClick={async () => { await getApi().reminders.retry(item.id); await client.invalidateQueries({ queryKey: ["message-log"] }); toast(t("sent")); }}>{t("retry")}</Button> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
