"use client";

import { useLocale } from "next-intl";
import { formatBDT, parseMoneyToPaisa } from "@/lib/money";
import { cn } from "@/lib/cn";

export function Money({
  value,
  tone = "ink",
  className,
  absolute = false,
}: {
  value: string | number;
  tone?: "ink" | "due" | "paid" | "overdue" | "muted";
  className?: string;
  absolute?: boolean;
}) {
  const locale = useLocale() === "en" ? "en" : "bn";
  const paisa = typeof value === "number" ? value : parseMoneyToPaisa(value);
  const shown = absolute ? Math.abs(paisa) : paisa;
  const color = {
    ink: "text-ink",
    due: "text-danger",
    paid: "text-primary",
    overdue: "text-amber",
    muted: "text-muted",
  }[tone];
  return <span className={cn("tabular font-semibold", color, className)}>{formatBDT(shown, { locale })}</span>;
}
