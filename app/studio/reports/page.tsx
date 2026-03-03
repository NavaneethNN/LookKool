import { PageHeader } from "@/components/admin/page-header";
import dynamic from "next/dynamic";

const ReportsDashboard = dynamic(
  () => import("@/components/admin/reports/reports-dashboard").then(m => m.ReportsDashboard),
  { loading: () => <div className="animate-pulse rounded-xl border bg-white shadow-sm p-6"><div className="h-64 w-full rounded-lg bg-muted" /></div> }
);

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
