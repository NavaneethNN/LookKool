import { PageHeader } from "@/components/admin/page-header";
import { BarcodeManager } from "@/components/admin/barcode-manager";

export default function BarcodePage() {
  return (
    <>
      <PageHeader
        title="Barcode Manager"
        description="Generate, assign, and print barcodes for product variants"
      />
      <BarcodeManager />
    </>
  );
}
