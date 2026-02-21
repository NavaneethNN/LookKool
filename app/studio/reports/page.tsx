import { PageHeader } from "@/components/admin/page-header";
import { ReportsDashboard } from "@/components/admin/reports-dashboard";

export default async function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Sales, profit, GST, and stock reports"
      />
      <ReportsDashboard />
    </>
  );
}
