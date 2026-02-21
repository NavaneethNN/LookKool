import { getStoreSettings } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { BillingPOS } from "@/components/admin/billing-pos-enhanced";

export default async function BillingPage() {
  const settings = await getStoreSettings();

  const storeConfig = {
    enableGst: settings?.enableGst ?? true,
    gstRate: settings?.gstRate ?? "5.00",
    hsnCode: settings?.hsnCode ?? "6104",
  };

  return (
    <>
      <PageHeader
        title="Billing"
        description="In-store POS — create bills for walk-in customers"
      />
      <BillingPOS storeConfig={storeConfig} />
    </>
  );
}
