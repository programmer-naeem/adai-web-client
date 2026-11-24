"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button, Field, TextInput } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getApi, isApiError } from "@/lib/api";
import { errorCode } from "@/lib/errors";
import { cn } from "@/lib/cn";

const DEMOS = [
  { phone: "01711345678", role: "owner" },
  { phone: "01812456789", role: "manager" },
  { phone: "01913567890", role: "collector" },
  { phone: "01611223344", role: "superadmin" },
] as const;

export function LoginScreen() {
  const t = useTranslations("auth");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const { signIn } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const form = useForm({ defaultValues: { phone: "01711345678", password: "aadai123" } });
  const [otpMode, setOtpMode] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFieldError("");
    const { phone, password } = form.getValues();
    try {
      if (otpMode) {
        const result = await getApi().auth.verifyOtp({ phone, code, purpose: "login" });
        if (!result.auth) throw new Error("no auth");
        await signIn(result.auth);
      } else {
        const result = await getApi().auth.login({ phone, password });
        await signIn(result);
      }
      const session = await getApi().auth.me();
      router.replace(session.platformRole ? "/admin/tenants" : "/dashboard");
    } catch (error) {
      const message = errors(errorCode(error) as "UNKNOWN");
      setFieldError(message);
      if (!isApiError(error)) toast(message, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <h1 className="text-3xl font-bold">{t("loginTitle")}</h1>
      <p className="mt-1 text-muted">{t("loginHint")}</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <Field label={common("phone")} error={fieldError}>
          <TextInput data-testid="login-phone" inputMode="tel" autoComplete="username" {...form.register("phone")} />
        </Field>
        {otpMode ? (
          <Field label={t("code")}>
            <TextInput data-testid="login-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
        ) : (
          <Field label={common("password")}>
            <TextInput data-testid="login-password" type="password" autoComplete="current-password" {...form.register("password")} />
          </Field>
        )}
        <Button data-testid="login-submit" type="submit" disabled={busy}>{otpMode ? t("verify") : t("login")}</Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-primary">
        <button type="button" onClick={async () => { setOtpMode(true); const sent = await getApi().auth.requestOtp({ phone: form.getValues("phone"), purpose: "login" }); if (sent.devCode) setCode(sent.devCode); }}>{t("otpLogin")}</button>
        <button type="button" onClick={() => router.push("/signup")}>{t("signup")}</button>
        <button type="button" onClick={() => router.push("/forgot")}>{t("forgot")}</button>
      </div>
      <div className="mt-8 rounded-2xl bg-mint p-4">
        <p className="font-semibold">{t("demoTitle")}</p>
        <p className="text-sm text-muted">{t("demoPassword")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMOS.map((demo) => (
            <button key={demo.phone} type="button" className="rounded-full bg-white px-3 py-2 text-sm font-semibold" onClick={() => { form.setValue("phone", demo.phone); form.setValue("password", "aadai123"); setOtpMode(false); }}>
              {t(demo.role)} · {demo.phone}
            </button>
          ))}
        </div>
      </div>
    </AuthFrame>
  );
}

export function SignupScreen() {
  const t = useTranslations("auth");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const { signIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code" | "shop">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(t("retail"));
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <AuthFrame>
      <h1 className="text-3xl font-bold">{t("signupTitle")}</h1>
      {error ? <p className="mt-2 text-danger">{error}</p> : null}
      {step === "phone" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const sent = await getApi().auth.requestOtp({ phone, purpose: "signup" });
            if (sent.devCode) setCode(sent.devCode);
            setStep("code");
          } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
        }}>
          <Field label={common("phone")}><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
          <Button type="submit">{t("sendOtp")}</Button>
        </form>
      ) : null}
      {step === "code" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const result = await getApi().auth.verifyOtp({ phone, code, purpose: "signup" });
            if (!result.ticket) throw new Error("ticket");
            setTicket(result.ticket);
            setStep("shop");
          } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
        }}>
          <Field label={t("code")}><TextInput data-testid="signup-code" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          {code ? <p className="text-sm text-muted">{t("devCode", { code })}</p> : null}
          <Button type="submit">{t("verify")}</Button>
        </form>
      ) : null}
      {step === "shop" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const result = await getApi().auth.signup({ ticket, fullName, password, businessName, businessType, address, language: "bn" });
            await signIn(result);
            router.replace("/dashboard");
          } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
        }}>
          <Field label={t("fullName")}><TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label={t("businessName")}><TextInput data-testid="signup-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></Field>
          <Field label={t("businessType")}><TextInput value={businessType} onChange={(e) => setBusinessType(e.target.value)} /></Field>
          <Field label={t("address")}><TextInput value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <Field label={common("password")}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Button type="submit" data-testid="signup-submit">{t("create")}</Button>
        </form>
      ) : null}
      <button type="button" className="mt-4 text-sm font-semibold text-primary" onClick={() => router.push("/login")}>{t("haveAccount")}</button>
    </AuthFrame>
  );
}

export function ForgotScreen() {
  const t = useTranslations("auth");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <AuthFrame>
      <h1 className="text-3xl font-bold">{t("resetTitle")}</h1>
      {error ? <p className="mt-2 text-danger">{error}</p> : null}
      {step === "phone" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const sent = await getApi().auth.requestOtp({ phone, purpose: "reset" });
            if (sent.devCode) setCode(sent.devCode);
            setStep("code");
          } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
        }}>
          <Field label={common("phone")}><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Button type="submit">{t("sendOtp")}</Button>
        </form>
      ) : null}
      {step === "code" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const result = await getApi().auth.verifyOtp({ phone, code, purpose: "reset" });
            if (!result.ticket) throw new Error("ticket");
            setTicket(result.ticket);
            setStep("password");
          } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
        }}>
          <Field label={t("code")}><TextInput value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Button type="submit">{t("verify")}</Button>
        </form>
      ) : null}
      {step === "password" ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await getApi().auth.resetPassword({ ticket, newPassword: password });
            router.replace("/login");
          } catch (err) { setError(errors(errorCode(err) as "UNKNOWN")); }
        }}>
          <Field label={t("newPassword")}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Button type="submit">{t("reset")}</Button>
        </form>
      ) : null}
    </AuthFrame>
  );
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const common = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-lg font-bold text-white">{common("brandMark")}</span>
          <span className="text-2xl font-bold text-primary">{common("brand")}</span>
        </div>
        <div className="flex rounded-xl border border-line p-1 text-sm font-semibold">
          {(["bn", "en"] as const).map((item) => (
            <button key={item} type="button" className={cn("rounded-lg px-2 py-1", locale === item ? "bg-primary text-white" : "")} onClick={() => router.replace(pathname, { locale: item })}>
              {item === "bn" ? common("langShortBn") : common("langShortEn")}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
