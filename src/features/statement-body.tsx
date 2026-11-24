import bn from "../../messages/bn.json";
import en from "../../messages/en.json";
import { StatementActions } from "@/features/statement-actions";
import type { PublicStatement } from "@/lib/api/types";
import { formatDate } from "@/lib/date";
import { formatBDT, parseMoneyToPaisa } from "@/lib/money";

function copyFor(language: PublicStatement["language"]) {
  return (language === "en" ? en : bn).statement;
}

export function StatementView({ data, token }: { data: PublicStatement; token: string }) {
  const copy = copyFor(data.language);
  const locale = data.language;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-6">
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-bold text-white">
          {data.logoText || data.businessName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-primary">{data.businessName}</p>
          {data.address ? <p className="text-sm text-muted">{data.address}</p> : null}
        </div>
      </header>
      <h1 className="text-3xl font-bold leading-tight">{data.customerName}</h1>
      <p className="text-base text-muted">{data.maskedPhone}</p>
      <section className="rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="statement-balance">
        <h2 id="statement-balance" className="text-sm font-medium text-muted">
          {copy.balance}
        </h2>
        <p className="text-4xl font-bold tabular text-danger">{formatBDT(parseMoneyToPaisa(data.balance), { locale })}</p>
        <p className="mt-2 text-base">
          {copy.overdue}: <span className="font-semibold text-[#9a3412]">{formatBDT(parseMoneyToPaisa(data.overdue), { locale })}</span>
        </p>
      </section>
      <h2 className="text-lg font-semibold">{copy.recent}</h2>
      <ul className="flex flex-col gap-2">
        {data.entries.map((entry, index) => (
          <li key={`${entry.date}-${entry.label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-base">
            <span className="min-w-0">
              <span className="block font-medium">{formatDate(entry.date, locale)}</span>
              <span className="block truncate text-muted">{entry.label}</span>
            </span>
            <span className={entry.direction === "Dr" ? "shrink-0 font-semibold text-danger" : "shrink-0 font-semibold text-primary"}>
              <span className="sr-only">{entry.direction === "Dr" ? copy.due : copy.paid} </span>
              {formatBDT(parseMoneyToPaisa(entry.amount), { locale })}
            </span>
          </li>
        ))}
      </ul>
      <StatementActions token={token} phone={data.businessPhone} callLabel={copy.call} pdfLabel={copy.pdf} stopLabel={copy.stop} stoppedLabel={copy.stopped} />
    </main>
  );
}

export function StatementMissing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{bn.statement.missing}</h1>
      <p className="mt-2 text-muted">{bn.statement.missingHint}</p>
    </main>
  );
}
