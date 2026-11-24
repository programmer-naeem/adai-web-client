"use client";

import { useEffect, useState } from "react";
import type { PublicStatement } from "@/lib/api/types";
import { StatementMissing, StatementView } from "@/features/statement-body";

export function StatementClientLoad({ token }: { token: string }) {
  const [data, setData] = useState<PublicStatement | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/api").then(async ({ getApi, isApiError }) => {
      try {
        const next = await getApi().statements.publicGet(token);
        if (!cancelled) setData(next);
      } catch (error) {
        if (!cancelled && (!isApiError(error) || error.status === 404)) setMissing(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (data) return <StatementView data={data} token={token} />;
  if (missing) return <StatementMissing />;
  return <StatementMissing />;
}
