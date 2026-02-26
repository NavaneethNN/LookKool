"use client";

import {
  TrendingUp,
  IndianRupee,
  FileSpreadsheet,
  Package,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReport } from "./sales-report";
import { ProfitReport } from "./profit-report";
import { GstReport } from "./gst-report";
import { StockReport } from "./stock-report";

export function ReportsDashboard() {
  return (
    <Tabs defaultValue="sales" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="sales" className="gap-1.5"><TrendingUp className="w-4 h-4" /> Sales</TabsTrigger>
        <TabsTrigger value="profit" className="gap-1.5"><IndianRupee className="w-4 h-4" /> Profit</TabsTrigger>
        <TabsTrigger value="gst" className="gap-1.5"><FileSpreadsheet className="w-4 h-4" /> GST</TabsTrigger>
        <TabsTrigger value="stock" className="gap-1.5"><Package className="w-4 h-4" /> Stock</TabsTrigger>
      </TabsList>
      <TabsContent value="sales"><SalesReport /></TabsContent>
      <TabsContent value="profit"><ProfitReport /></TabsContent>
      <TabsContent value="gst"><GstReport /></TabsContent>
      <TabsContent value="stock"><StockReport /></TabsContent>
    </Tabs>
  );
}
