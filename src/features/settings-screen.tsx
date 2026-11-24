"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button, Field, TextInput } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getApi } from "@/lib/api";
import { errorCode } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { formatPhone } from "@/lib/phone";
import type { Role } from "@/lib/permissions";

const ROLES: Role[] = ["Owner", "Manager", "Staff", "Collector", "Viewer"];

export function SettingsScreen() {
  const t = useTranslations("settings");
  const roles = useTranslations("roles");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const status = useTranslations("status");
  const locale = useLocale() === "en" ? "en" : "bn";
  const { user, setUser } = useAuth();
  const toast = useToast();
  const client = useQueryClient();
  const tenant = useQuery({ queryKey: ["tenant"], queryFn: () => getApi().settings.tenant() });
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => getApi().staff.list(), enabled: can(user?.role, "staff.manage") || can(user?.role, "dashboard.view") });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Staff");
  const ready = tenant.data;
  const shownName = name || (locale === "en" ? ready?.name : ready?.nameBn) || "";
  const shownPhone = phone || ready?.phoneE164 || "";
  const shownAddress = address || ready?.address || "";
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle", { business: shownName })}</p>
      </div>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{common("language")}</h2>
        <div className="mt-3 flex gap-2">
          {(["bn", "en"] as const).map((item) => (
            <Button key={item} variant={locale === item ? "primary" : "outline"} onClick={async () => {
              router.replace(pathname, { locale: item });
              if (user) {
                const next = await getApi().auth.updateMe({ preferredLanguage: item });
                setUser(next);
              }
            }}>{item === "bn" ? common("bangla") : common("english")}</Button>
          ))}
        </div>
      </section>
      {can(user?.role, "settings.manage") && ready ? (
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">{t("business")}</h2>
          <p className="text-sm text-muted">{t("businessHint")}</p>
          <form className="mt-3 flex flex-col gap-3" onSubmit={async (event) => {
            event.preventDefault();
            await getApi().settings.updateTenant({ nameBn: shownName, name: shownName, phone: shownPhone, address: shownAddress });
            await client.invalidateQueries({ queryKey: ["tenant"] });
            toast(t("saved"));
          }}>
            <Field label={t("shopName")}><TextInput data-testid="shop-name" value={shownName} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label={t("shopPhone")}><TextInput value={shownPhone} onChange={(event) => setPhone(event.target.value)} /></Field>
            <Field label={t("shopAddress")}><TextInput value={shownAddress} onChange={(event) => setAddress(event.target.value)} /></Field>
            <Field label={t("creditDays")}><TextInput defaultValue={String(ready.settings.defaultCreditDays)} onBlur={async (event) => { await getApi().settings.updateSettings({ defaultCreditDays: Number(event.target.value) || 7 }); toast(t("saved")); }} /></Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" defaultChecked={ready.settings.requireCollectionApproval} onChange={async (event) => { await getApi().settings.updateSettings({ requireCollectionApproval: event.target.checked }); toast(t("saved")); }} />
              {t("approval")}
            </label>
            <Button type="submit" data-testid="shop-save">{t("saved")}</Button>
          </form>
        </section>
      ) : null}
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{t("staff")}</h2>
        <p className="text-sm text-muted">{t("staffHint")}</p>
        {can(user?.role, "staff.manage") ? (
          <form className="mt-3 grid gap-2 md:grid-cols-4" onSubmit={async (event) => {
            event.preventDefault();
            try {
              await getApi().staff.invite({ fullName: inviteName, phone: invitePhone, role: inviteRole });
              setInviteName("");
              setInvitePhone("");
              await client.invalidateQueries({ queryKey: ["staff"] });
              toast(t("saved"));
            } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
          }}>
            <TextInput placeholder={t("invite")} value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
            <TextInput placeholder={common("phonePlaceholder")} value={invitePhone} onChange={(event) => setInvitePhone(event.target.value)} />
            <select className="h-12 rounded-xl border border-line px-2" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Role)}>
              {ROLES.filter((role) => role !== "Owner" || can(user?.role, "staff.assignOwner")).map((role) => <option key={role} value={role}>{roles(role)}</option>)}
            </select>
            <Button type="submit">{t("invite")}</Button>
          </form>
        ) : null}
        <ul className="mt-4 flex flex-col gap-2">
          {(staff.data ?? []).map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2">
              <div>
                <p className="font-semibold">{member.fullName}</p>
                <p className="text-sm text-muted">{formatPhone(member.phoneE164, locale)} · {roles(member.role)} · {t("assigned", { count: member.assignedCustomers })}</p>
              </div>
              {can(user?.role, "staff.manage") ? (
                <div className="flex gap-2">
                  <Button variant="outline" className="min-h-10" onClick={async () => {
                    try {
                      await getApi().staff.update(member.id, { isActive: !member.isActive });
                      await client.invalidateQueries({ queryKey: ["staff"] });
                    } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
                  }}>{member.isActive ? status("inactive") : status("active")}</Button>
                  <Button variant="ghost" className="min-h-10 text-danger" onClick={async () => {
                    try {
                      await getApi().staff.remove(member.id);
                      await client.invalidateQueries({ queryKey: ["staff"] });
                    } catch (error) { toast(errors(errorCode(error) as "UNKNOWN"), "danger"); }
                  }}>×</Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {can(user?.role, "settings.manage") ? (
        <Button variant="outline" onClick={async () => { await getApi().settings.resetDemo(); toast(t("resetDone")); window.location.reload(); }}>{t("reset")}</Button>
      ) : null}
    </div>
  );
}

