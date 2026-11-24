"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth-provider";
import { AdminNav } from "@/features/admin-screen";
import { useRouter } from "@/i18n/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const common = useTranslations("common");
  const t = useTranslations("admin");

  useEffect(() => {
    if (ready && user && !user.platformRole) router.replace("/dashboard");
  }, [ready, user, router]);

  if (!ready || !user) return <p className="text-muted">{common("loading")}</p>;
  if (!user.platformRole) return <p className="text-muted">{t("forbidden")}</p>;
  return (
    <div className="flex flex-col gap-4">
      <AdminNav />
      {children}
    </div>
  );
}
