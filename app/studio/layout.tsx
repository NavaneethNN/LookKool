import { requireAdminOrCashier } from "@/lib/admin/require-admin";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "LookKool Studio",
  description: "LookKool Admin Dashboard",
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireAdminOrCashier();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar adminEmail={staff.email} role={staff.role} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
