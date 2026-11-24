"use client";

import { useEffect, useState } from "react";

export function StatementViewLogger({ token }: { token: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import("@/lib/api").then(({ getApi }) => getApi().statements.publicGet(token).catch(() => undefined));
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [token]);
  return null;
}

export function StatementActions({
  token,
  phone,
  callLabel,
  pdfLabel,
  stopLabel,
  stoppedLabel,
}: {
  token: string;
  phone: string;
  callLabel: string;
  pdfLabel: string;
  stopLabel: string;
  stoppedLabel: string;
}) {
  const [stopped, setStopped] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="no-print mt-2 flex flex-col gap-3">
      <a className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-white" href={`tel:${phone}`}>
        {callLabel}
      </a>
      <button type="button" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-white px-4 text-base font-semibold" onClick={() => window.print()}>
        {pdfLabel}
      </button>
      <button
        type="button"
        className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-base font-semibold text-danger disabled:opacity-60"
        disabled={busy || stopped}
        onClick={() => {
          setBusy(true);
          void import("@/lib/api")
            .then(({ getApi }) => getApi().statements.optOut(token))
            .then(() => setStopped(true))
            .finally(() => setBusy(false));
        }}
      >
        {stopped ? stoppedLabel : stopLabel}
      </button>
    </div>
  );
}
