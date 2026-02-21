"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Database,
  RefreshCcw,
  ShieldCheck,
  Package,
  Users,
  ShoppingBag,
  Receipt,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBackupData, getBackupStats } from "@/lib/actions/billing-actions";

type Stats = Awaited<ReturnType<typeof getBackupStats>>;

export function BackupManager({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const s = await getBackupStats();
      setStats(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh stats");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = await getBackupData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lookkool-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate backup");
    } finally {
      setDownloading(false);
    }
  };

  const statItems = [
    { label: "Products", value: stats.products, icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "Variants / SKUs", value: stats.variants, icon: Package, color: "text-indigo-600 bg-indigo-50" },
    { label: "Online Orders", value: stats.orders, icon: ShoppingBag, color: "text-orange-600 bg-orange-50" },
    { label: "In-Store Bills", value: stats.bills, icon: Receipt, color: "text-pink-600 bg-pink-50" },
    { label: "Customers", value: stats.customers, icon: Users, color: "text-green-600 bg-green-50" },
    { label: "Suppliers", value: stats.suppliers, icon: Truck, color: "text-cyan-600 bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Full Data Export</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download a complete JSON backup of all your store data including products, orders, bills,
              customers, suppliers, purchase orders, inventory adjustments, and more.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDownload} disabled={downloading} className="gap-2 bg-primary hover:bg-primary/90">
                {downloading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? "Generating Backup..." : "Download Backup (JSON)"}
              </Button>
              <Button variant="outline" onClick={refreshStats} disabled={refreshing} className="gap-1.5">
                <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh Stats
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-900">Data Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-lg border p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{item.value.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">💡 Backup Tips</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-amber-700">
          <li>Download backups regularly (at least weekly)</li>
          <li>Store backups in a safe location (cloud storage, external drive)</li>
          <li>The backup includes all data except uploaded images (stored in Supabase Storage)</li>
          <li>For complete disaster recovery, also backup your Supabase project separately</li>
        </ul>
      </div>
    </div>
  );
}
