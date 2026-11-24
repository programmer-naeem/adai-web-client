"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Money } from "@/components/money";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { can } from "@/lib/permissions";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, permission: "dashboard.view" as const },
  { href: "/customers", key: "customers", icon: Users, permission: "dashboard.view" as const },
  { href: "/suppliers", key: "suppliers", icon: Truck, permission: "dashboard.full" as const },
  { href: "/collections", key: "collections", icon: HandCoins, permission: "dashboard.view" as const },
  { href: "/reminders", key: "reminders", icon: Bell, permission: "messages.send" as const },
  { href: "/reports", key: "reports", icon: BarChart3, permission: "reports.own" as const },
  { href: "/settings", key: "settings", icon: Settings, permission: "dashboard.view" as const },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const { user, ready, signOut, signIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const notes = useQuery({
    queryKey: ["notifications", user?.currentTenantId],
    queryFn: () => getApi().notifications.list(),
    enabled: Boolean(user),
  });
  const unread = notes.data?.filter((item) => !item.readAtUtc).length ?? 0;

  useEffect(() => {
    if (!ready || user) return;
    void (async () => {
      const { clearSessionCookie } = await import("@/lib/session");
      await clearSessionCookie();
      router.replace("/login");
    })();
  }, [ready, user, router]);

  if (!ready || !user) return <p className="p-8 text-muted">{common("loading")}</p>;

  const items = NAV.filter((item) => {
    if (item.permission === "reports.own") return can(user.role, "reports.view") || can(user.role, "reports.own");
    return can(user.role, item.permission);
  });
  const business = user.memberships.find((item) => item.tenantId === user.currentTenantId);
  const businessName = locale === "en" ? business?.tenantName : business?.tenantNameBn;

  async function switchBusiness(tenantId: string) {
    const result = await getApi().auth.switchTenant({ tenantId });
    await signIn(result);
    window.location.assign(locale === "en" ? "/en/dashboard" : "/dashboard");
  }

  return (
    <div className="min-h-screen bg-canvas md:grid md:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-line bg-white md:flex md:flex-col">
        <Brand />
        <BusinessChip name={businessName ?? ""} letter={business?.tenantNameBn.slice(0, 1) ?? "আ"} memberships={user.memberships} current={user.currentTenantId} onSwitch={switchBusiness} label={t("more")} />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} icon={item.icon} label={t(item.key)} />
          ))}
        </nav>
        <UserFooter name={user.fullName} role={user.role} onLogout={async () => { await signOut(); router.replace("/login"); }} logoutLabel={t("logout")} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-xl p-2 hover:bg-mint md:hidden" onClick={() => setOpen(true)} aria-label="menu">
              <Menu className="size-5" />
            </button>
            <p className="text-sm font-semibold text-muted md:hidden">{businessName}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <button type="button" className="relative rounded-xl p-2 hover:bg-mint" onClick={() => setBell((value) => !value)} aria-label="notifications">
              <Bell className="size-5" />
              {unread > 0 ? <span className="absolute right-1 top-1 size-2 rounded-full bg-danger" /> : null}
            </button>
            {can(user.role, "wallet.view") ? (
              <Link href="/wallet" className="hidden items-center gap-1 rounded-xl px-2 py-1 text-sm font-semibold text-primary hover:bg-mint sm:flex">
                <Wallet className="size-4" />
                <WalletChip />
              </Link>
            ) : null}
          </div>
          {bell ? (
            <div className="absolute right-4 top-14 w-80 rounded-2xl border border-line bg-white p-3 shadow-xl">
              {(notes.data ?? []).length === 0 ? <p className="text-sm text-muted">{common("empty")}</p> : null}
              {(notes.data ?? []).slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full rounded-xl px-2 py-2 text-left hover:bg-mint"
                  onClick={async () => {
                    await getApi().notifications.markRead(item.id);
                    setBell(false);
                    router.push(item.href || "/dashboard");
                  }}
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted">{item.body}</p>
                </button>
              ))}
            </div>
          ) : null}
        </header>
        <main className="px-4 py-5 pb-24 md:px-8 md:pb-10">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setOpen(false)}>
          <div className="flex h-full w-72 flex-col bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="close"><X /></button>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              {items.map((item) => (
                <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)} icon={item.icon} label={t(item.key)} onClick={() => setOpen(false)} />
              ))}
              <NavLink href="/messages" active={pathname.startsWith("/messages")} icon={Bell} label={t("messages")} onClick={() => setOpen(false)} />
              <NavLink href="/wallet" active={pathname.startsWith("/wallet")} icon={Wallet} label={t("wallet")} onClick={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white md:hidden">
        {[
          { href: "/dashboard", key: "home", icon: LayoutDashboard },
          { href: "/customers", key: "customers", icon: Users },
          { href: "/reports", key: "reports", icon: BarChart3 },
          { href: "/settings", key: "more", icon: Settings },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 py-2 text-xs font-semibold", pathname.startsWith(item.href) ? "text-primary" : "text-faint")}>
            <item.icon className="size-5" />
            {t(item.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-5">
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-lg font-bold text-white">আ</span>
      <span className="text-xl font-bold text-primary">আদায়</span>
    </div>
  );
}

function NavLink({ href, active, icon: Icon, label, onClick }: { href: string; active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold", active ? "bg-mint text-primary" : "text-muted hover:bg-canvas")}>
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function UserFooter({ name, role, onLogout, logoutLabel }: { name: string; role: string; onLogout: () => void; logoutLabel: string }) {
  const roles = useTranslations("roles");
  return (
    <div className="border-t border-line p-4">
      <p className="font-semibold">{name}</p>
      <p className="text-sm text-muted">{roles(role as "Owner")}</p>
      <button type="button" onClick={onLogout} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-danger">
        <LogOut className="size-4" /> {logoutLabel}
      </button>
    </div>
  );
}

function BusinessChip({
  name,
  letter,
  memberships,
  current,
  onSwitch,
}: {
  name: string;
  letter: string;
  memberships: { tenantId: string; tenantNameBn: string; tenantName: string }[];
  current: string;
  onSwitch: (id: string) => void;
  label: string;
}) {
  const locale = useLocale();
  return (
    <div className="mx-3 mb-2 rounded-2xl border border-line p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-white">{letter}</span>
        <p className="text-sm font-semibold leading-tight">{name}</p>
      </div>
      {memberships.length > 1 ? (
        <select className="mt-2 h-10 w-full rounded-lg border border-line px-2 text-sm" value={current} onChange={(event) => onSwitch(event.target.value)} aria-label="business">
          {memberships.map((item) => (
            <option key={item.tenantId} value={item.tenantId}>{locale === "en" ? item.tenantName : item.tenantNameBn}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="flex rounded-xl border border-line p-1 text-sm font-semibold">
      {(["bn", "en"] as const).map((item) => (
        <button key={item} type="button" className={cn("rounded-lg px-2 py-1", locale === item ? "bg-primary text-white" : "text-muted")} onClick={() => router.replace(pathname, { locale: item })}>
          {item === "bn" ? "বাং" : "EN"}
        </button>
      ))}
    </div>
  );
}

function WalletChip() {
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getApi().reminders.wallet() });
  if (!wallet.data) return null;
  return <Money value={wallet.data.balance} tone={wallet.data.low ? "overdue" : "paid"} />;
}
