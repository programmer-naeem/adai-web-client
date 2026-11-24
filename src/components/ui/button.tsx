import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  amber: "bg-amber text-white hover:opacity-90",
  danger: "bg-danger text-white hover:opacity-90",
  outline: "border border-line bg-white text-ink hover:bg-mint",
  ghost: "bg-transparent text-ink hover:bg-mint",
  mint: "bg-mint text-primary hover:bg-mint/70",
} as const;

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-primary",
        props.className,
      )}
    />
  );
});

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-primary",
        props.className,
      )}
    />
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
      {label}
      {children}
      {error ? <span className="text-sm font-medium text-danger">{error}</span> : null}
    </label>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "danger" | "ok" | "amber" | "mint";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-canvas text-muted",
    danger: "bg-danger-soft text-danger",
    ok: "bg-mint text-primary",
    amber: "bg-amber-soft text-amber",
    mint: "bg-mint text-primary-dark",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}
