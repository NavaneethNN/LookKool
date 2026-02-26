"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Star, Wallet, Plus, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCustomerLoyalty,
  addLoyaltyPoints,
  deductLoyaltyPoints,
  addStoreCredit,
  deductStoreCredit,
} from "@/lib/actions/loyalty.actions";

interface LoyaltyData {
  user: {
    userId: string;
    loyaltyPoints: number;
    creditBalance: string;
    totalSpent: string;
  };
  transactions: {
    transactionId: number;
    type: string;
    points: number;
    creditAmount: string;
    description: string;
    referenceId: string | null;
    createdAt: Date;
  }[];
}

export function CustomerLoyaltyCard({ userId }: { userId: string }) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add_points" | "deduct_points" | "add_credit" | "deduct_credit">("add_points");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    startTransition(async () => {
      try {
        const result = await getCustomerLoyalty(userId);
        setData(result as unknown as LoyaltyData);
      } catch { /* ignore */ }
    });
  };

  useEffect(() => { loadData(); }, [userId]);

  const openDialog = (mode: typeof dialogMode) => {
    setDialogMode(mode);
    setAmount("");
    setDescription("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const val = Number(amount);
    if (!val || val <= 0) { toast.error("Enter a valid amount"); return; }
    if (!description.trim()) { toast.error("Description is required"); return; }

    try {
      if (dialogMode === "add_points") {
        await addLoyaltyPoints({ userId, points: val, description });
        toast.success(`Added ${val} loyalty points`);
      } else if (dialogMode === "deduct_points") {
        await deductLoyaltyPoints({ userId, points: val, description });
        toast.success(`Deducted ${val} loyalty points`);
      } else if (dialogMode === "add_credit") {
        await addStoreCredit({ userId, amount: val, description });
        toast.success(`Added ₹${val} store credit`);
      } else {
        await deductStoreCredit({ userId, amount: val, description });
        toast.success(`Deducted ₹${val} store credit`);
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  if (!data) return null;

  const dialogTitles = {
    add_points: "Add Loyalty Points",
    deduct_points: "Deduct Loyalty Points",
    add_credit: "Add Store Credit",
    deduct_credit: "Deduct Store Credit",
  };

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm p-6 lg:col-span-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Loyalty & Credit
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Points Card */}
          <div className="rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-yellow-700">Loyalty Points</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{data.user.loyaltyPoints.toLocaleString()}</p>
            <p className="text-xs text-yellow-600 mt-1">Worth ₹{(data.user.loyaltyPoints * 0.5).toFixed(0)}</p>
            <div className="flex gap-1 mt-3">
              <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-300" onClick={() => openDialog("add_points")}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-300" onClick={() => openDialog("deduct_points")}>
                <Minus className="w-3 h-3 mr-1" /> Deduct
              </Button>
            </div>
          </div>

          {/* Credit Card */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700">Store Credit</span>
              <Wallet className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-900">₹{Number(data.user.creditBalance).toLocaleString("en-IN")}</p>
            <p className="text-xs text-green-600 mt-1">Available balance</p>
            <div className="flex gap-1 mt-3">
              <Button size="sm" variant="outline" className="h-7 text-xs border-green-300" onClick={() => openDialog("add_credit")}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs border-green-300" onClick={() => openDialog("deduct_credit")}>
                <Minus className="w-3 h-3 mr-1" /> Deduct
              </Button>
            </div>
          </div>

          {/* Total Spent */}
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-700">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">₹{Number(data.user.totalSpent).toLocaleString("en-IN")}</p>
            <p className="text-xs text-purple-600 mt-1">Lifetime purchases</p>
          </div>
        </div>

        {/* Transaction History */}
        {data.transactions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Transactions</h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 text-xs font-medium text-gray-600">Type</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-600">Details</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-600 text-right">Points</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-600 text-right">Credit</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-600 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.transactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {tx.points > 0 || Number(tx.creditAmount) > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className="text-xs capitalize">{tx.type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-3 py-2 text-xs text-right font-medium">
                        {tx.points !== 0 && (
                          <span className={tx.points > 0 ? "text-green-600" : "text-red-600"}>
                            {tx.points > 0 ? "+" : ""}{tx.points}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-medium">
                        {Number(tx.creditAmount) !== 0 && (
                          <span className={Number(tx.creditAmount) > 0 ? "text-green-600" : "text-red-600"}>
                            {Number(tx.creditAmount) > 0 ? "+" : ""}₹{Number(tx.creditAmount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 text-right whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Deduct Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialogTitles[dialogMode]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {dialogMode.includes("points") ? "Points" : "Amount (₹)"}
              </label>
              <Input
                type="number"
                min="1"
                step={dialogMode.includes("points") ? "1" : "0.01"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={dialogMode.includes("points") ? "e.g. 100" : "e.g. 500"}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for this transaction..."
              />
            </div>
            <Button onClick={handleSubmit} disabled={isPending} className="w-full">
              {isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
