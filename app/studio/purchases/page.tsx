import { PageHeader } from "@/components/admin/page-header";
import { PurchaseOrdersList } from "@/components/admin/purchases/purchase-orders-list";

export default function PurchasesPage() {
  return (
    <>
      <PageHeader
        title="Purchase Orders"
        description="Manage purchases from suppliers for stock replenishment"
      />
      <PurchaseOrdersList />
    </>
  );
}
