import { AdminTenantScreen } from "@/features/admin-screen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTenantScreen id={id} />;
}
