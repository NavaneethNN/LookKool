import { PageHeader } from "@/components/admin/page-header";
import { InventoryManager } from "@/components/admin/inventory-manager";
import {
  getInventoryOverview,
  getLowStockItems,
  getStockAdjustments,
} from "@/lib/actions/inventory.actions";

export default async function InventoryPage() {
  const [overview, lowStock, adjustments] = await Promise.all([
    getInventoryOverview(),
    getLowStockItems(10),
    getStockAdjustments({ page: 1 }),
  ]);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Track stock levels, low-stock alerts, and stock adjustments"
      />
      <InventoryManager
        initialOverview={overview}
        initialLowStock={lowStock}
        initialAdjustments={adjustments}
      />
    </>
  );
}
