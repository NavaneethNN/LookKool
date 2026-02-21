import { getStoreSettings } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import dynamic from "next/dynamic";

const BillingPOS = dynamic(
  () => import("@/components/admin/billing-pos-enhanced").then(m => m.BillingPOS),
  { ssr: false, loading: () => <div className="animate-pulse rounded-xl border bg-white shadow-sm p-6"><div className="h-10 w-full rounded-lg bg-muted mb-4" /><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 w-full rounded-lg bg-muted" />)}</div></div> }
);

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
