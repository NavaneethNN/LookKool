import { PageHeader } from "@/components/admin/page-header";
import { SuppliersList } from "@/components/admin/suppliers-list";

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Manage your product suppliers and vendors"
      />
      <SuppliersList />
    </>
  );
}
