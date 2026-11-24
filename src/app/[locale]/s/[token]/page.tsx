import type { Metadata } from "next";
import { cache } from "react";
import bn from "../../../../../messages/bn.json";
import { StatementViewLogger } from "@/features/statement-actions";
import { StatementView } from "@/features/statement-body";
import { StatementClientLoad } from "@/features/statement-client";
import { getApi, isApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

const loadStatement = cache(async (token: string) => {
  try {
    return await getApi().statements.publicGet(token);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const data = await loadStatement(token);
  return {
    title: data?.businessName ?? bn.meta.title,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const initial = await loadStatement(token);
  if (!initial) return <StatementClientLoad token={token} />;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(initial.language)}` }} />
      <StatementView data={initial} token={token} />
      <StatementViewLogger token={token} />
    </>
  );
}
