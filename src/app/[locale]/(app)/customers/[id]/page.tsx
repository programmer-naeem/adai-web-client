import { CustomerLedgerScreen } from "@/features/ledger-screen";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return <CustomerLedgerScreen id={id} tab={query.tab ?? "ledger"} />;
}
