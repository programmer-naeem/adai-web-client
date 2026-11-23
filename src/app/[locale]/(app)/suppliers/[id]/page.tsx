import { SupplierLedgerScreen } from "@/features/ledger-screen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierLedgerScreen id={id} />;
}
