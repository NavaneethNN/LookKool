import { PageHeader } from "@/components/admin/page-header";
import { BackupManager } from "@/components/admin/backup-manager";
import { getBackupStats } from "@/lib/actions/billing-actions";

export default async function BackupPage() {
  const stats = await getBackupStats();

  return (
    <>
      <PageHeader
        title="Backup"
        description="Export store data for safekeeping"
      />
      <BackupManager initialStats={stats} />
    </>
  );
}
