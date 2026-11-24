import type { Metadata } from "next";
import { StatementScreen } from "@/features/misc-screens";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <StatementScreen token={token} />;
}
