"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  X,
  ShoppingBag,
  User,
  Receipt,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  searchProductsForBilling,
  createInStoreBill,
  getInStoreBills,
} from "@/lib/actions/admin-actions";

// ─── Types ─────────────────────────────────────────────────────

type Variant = {
  variantId: number;
  color: string;
  size: string;
  stockCount: number;
  sku: string | null;
  priceModifier: string | null;
};

type SearchProduct = {
  productId: number;
  productName: string;
  productCode: string;
  basePrice: string;
  mrp: string;
  variants: Variant[];
};

type CartItem = {
  id: string; // unique key: productId-variantId
  productId: number;
  variantId: number;
  productName: string;
  color: string;
  size: string;
  sku: string | null;
  price: number;
  mrp: number;
  quantity: number;
  maxStock: number;
  hsn: string;
};

type InStoreBill = {
  billId: number;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: string;
  paymentMode: string;
  billDate: Date | string;
  items: string;
};

type StoreConfig = {
  enableGst: boolean;
  gstRate: string;
  hsnCode: string;
};

// ─── Component ─────────────────────────────────────────────────

export function BillingPOS({ storeConfig }: { storeConfig: StoreConfig }) {
  // ── Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [notes, setNotes] = useState("");

  // ── Bill history
  const [bills, setBills] = useState<InStoreBill[]>([]);
  const [billsTotal, setBillsTotal] = useState(0);
  const [billsPage, setBillsPage] = useState(1);
  const [billsTotalPages, setBillsTotalPages] = useState(1);
  const [billSearch, setBillSearch] = useState("");
  const [loadingBills, setLoadingBills] = useState(false);

  // ── Submission
  const [submitting, setSubmitting] = useState(false);
  const [lastBillId, setLastBillId] = useState<number | null>(null);
  const [billSuccessOpen, setBillSuccessOpen] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Config
  const gstRate = Number(storeConfig.gstRate) || 5;
  const hsnCode = storeConfig.hsnCode || "6104";
  const enableGst = storeConfig.enableGst;

  // ─── Product search ────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchProductsForBilling(q);
      setSearchResults(results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doSearch(val), 300);
  };

  // ─── Add to cart ──────────────────────────────────
  const addToCart = (product: SearchProduct, variant: Variant) => {
    const key = `${product.productId}-${variant.variantId}`;
    const price = Number(product.basePrice) + (Number(variant.priceModifier) || 0);
    const mrp = Number(product.mrp) + (Number(variant.priceModifier) || 0);

    setCart((prev) => {
      const existing = prev.find((c) => c.id === key);
      if (existing) {
        if (existing.quantity >= variant.stockCount) {
          toast.error("Max stock reached");
          return prev;
        }
        return prev.map((c) =>
          c.id === key ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      if (variant.stockCount <= 0) {
        toast.error("Out of stock");
        return prev;
      }
      return [
        ...prev,
        {
          id: key,
          productId: product.productId,
          variantId: variant.variantId,
          productName: product.productName,
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          price,
          mrp,
          quantity: 1,
          maxStock: variant.stockCount,
          hsn: hsnCode,
        },
      ];
    });

    setSearchQuery("");
    setSearchResults([]);
    setVariantDialogOpen(false);
    setSelectedProduct(null);
    searchInputRef.current?.focus();
  };

  const handleProductClick = (product: SearchProduct) => {
    // If product has exactly 1 variant, add directly
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
      return;
    }
    // Otherwise, show variant picker
    setSelectedProduct(product);
    setVariantDialogOpen(true);
  };

  // ─── Cart operations ─────────────────────────────
  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newQty = c.quantity + delta;
        if (newQty <= 0) return c;
        if (newQty > c.maxStock) {
          toast.error("Max stock reached");
          return c;
        }
        return { ...c, quantity: newQty };
      })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerGstin("");
    setDiscount("");
    setNotes("");
    setPaymentMode("cash");
  };

  // ─── Calculations ─────────────────────────────────
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const discountAmt = Number(discount) || 0;
  const afterDiscount = subtotal - discountAmt;
  const taxableAmount = enableGst
    ? (afterDiscount * 100) / (100 + gstRate)
    : afterDiscount;
  const totalTax = enableGst ? afterDiscount - taxableAmount : 0;
  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;
  const cgstAmount = totalTax / 2;
  const sgstAmount = totalTax / 2;
  const roundedTotal = Math.round(afterDiscount);
  const roundOff = roundedTotal - afterDiscount;

  // ─── Create bill ──────────────────────────────────
  const handleCreateBill = async () => {
    if (cart.length === 0) {
      toast.error("Add items to cart first");
      return;
    }
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((c) => ({
        productId: c.productId,
        variantId: c.variantId,
        productName: c.productName,
        variant: `${c.color} / ${c.size}`,
        sku: c.sku,
        hsn: c.hsn,
        quantity: c.quantity,
        rate: c.price,
        amount: c.price * c.quantity,
      }));

      const bill = await createInStoreBill({
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerGstin: customerGstin || undefined,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmt.toFixed(2),
        taxableAmount: taxableAmount.toFixed(2),
        cgstRate: enableGst ? cgstRate.toFixed(2) : "0.00",
        cgstAmount: enableGst ? cgstAmount.toFixed(2) : "0.00",
        sgstRate: enableGst ? sgstRate.toFixed(2) : "0.00",
        sgstAmount: enableGst ? sgstAmount.toFixed(2) : "0.00",
        igstRate: "0.00",
        igstAmount: "0.00",
        roundOff: roundOff.toFixed(2),
        totalAmount: roundedTotal.toFixed(2),
        paymentMode,
        items: JSON.stringify(itemsPayload),
        notes: notes || undefined,
      });

      setLastBillId(bill.billId);
      setLastInvoiceNumber(bill.invoiceNumber);
      setBillSuccessOpen(true);
      clearCart();
      toast.success("Bill created successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Bill history ─────────────────────────────────
  const loadBills = useCallback(async (page: number, search?: string) => {
    setLoadingBills(true);
    try {
      const result = await getInStoreBills({ page, search });
      setBills(result.bills as unknown as InStoreBill[]);
      setBillsTotal(result.total);
      setBillsPage(result.page);
      setBillsTotalPages(result.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load bills");
    } finally {
      setLoadingBills(false);
    }
  }, []);

  const handleBillSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillSearch(e.target.value);
  };

  useEffect(() => {
    // debounce bill search
    const t = setTimeout(() => {
      loadBills(1, billSearch || undefined);
    }, 400);
    return () => clearTimeout(t);
  }, [billSearch, loadBills]);

  return (
    <div className="h-full">
      <Tabs defaultValue="new-bill" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new-bill" className="gap-2">
            <Receipt className="w-4 h-4" />
            New Bill
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-2"
            onClick={() => loadBills(1)}
          >
            <ShoppingBag className="w-4 h-4" />
            Bill History
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════
            NEW BILL TAB
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="new-bill">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Left: Product search & cart ────────────────── */}
            <div className="xl:col-span-2 space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products by name or code..."
                  className="pl-10 h-12 text-base border-2 focus:border-primary"
                  autoFocus
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Searching...
                  </span>
                )}
              </div>

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="rounded-xl border bg-white shadow-lg max-h-72 overflow-y-auto">
                  {searchResults.map((product) => {
                    const inStockVariants = product.variants.filter(
                      (v) => v.stockCount > 0
                    );
                    return (
                      <button
                        key={product.productId}
                        onClick={() => handleProductClick(product)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Code: {product.productCode} ·{" "}
                            {inStockVariants.length} variant(s) in stock
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{Number(product.basePrice).toLocaleString("en-IN")}
                          </p>
                          {Number(product.mrp) > Number(product.basePrice) && (
                            <p className="text-xs text-gray-400 line-through">
                              ₹{Number(product.mrp).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Cart items */}
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 rounded-t-xl">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Cart ({cart.length} items)
                  </h3>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </Button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Cart is empty</p>
                    <p className="text-xs mt-1">Search and add products above</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {item.color} / {item.size}
                            </span>
                            {item.sku && (
                              <span className="text-xs text-gray-400">
                                SKU: {item.sku}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ₹{item.price.toLocaleString("en-IN")} × {item.quantity}
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-gray-100 transition-colors"
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0 w-24">
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Customer info & totals ──────────────── */}
            <div className="space-y-4">
              {/* Customer details */}
              <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <User className="w-4 h-4" />
                  Customer Details
                  <span className="text-xs font-normal text-gray-400">(optional)</span>
                </div>
                <div className="space-y-3">
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="h-10"
                  />
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="h-10"
                  />
                  <Input
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    placeholder="GSTIN (for B2B)"
                    className="h-10"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Payment & Discount */}
              <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <IndianRupee className="w-4 h-4" />
                  Payment
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Payment Mode
                    </label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Discount (₹)
                    </label>
                    <Input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Notes
                    </label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Totals summary */}
              <div className="rounded-xl border bg-white shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Bill Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>−₹{discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {enableGst && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-gray-500">
                        <span>Taxable Amount</span>
                        <span>₹{taxableAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>CGST @ {cgstRate}%</span>
                        <span>₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>SGST @ {sgstRate}%</span>
                        <span>₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {roundOff !== 0 && (
                    <div className="flex justify-between text-gray-400 text-xs">
                      <span>Round Off</span>
                      <span>
                        {roundOff >= 0 ? "+" : ""}₹{roundOff.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total</span>
                    <span>₹{roundedTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreateBill}
                  disabled={cart.length === 0 || submitting}
                  className="w-full mt-5 h-12 text-base font-semibold bg-primary hover:bg-primary/90 gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  {submitting ? "Creating Bill..." : "Generate Bill"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            BILL HISTORY TAB
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="history">
          <div className="space-y-4">
            {/* Search bills */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={billSearch}
                onChange={handleBillSearchChange}
                placeholder="Search by invoice #, name, or phone..."
                className="pl-10"
              />
            </div>

            {/* Bills table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Payment
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingBills ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        Loading bills...
                      </td>
                    </tr>
                  ) : bills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        No bills found
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => (
                      <tr key={bill.billId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {bill.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {bill.customerName || "Walk-in"}
                          </p>
                          {bill.customerPhone && (
                            <p className="text-xs text-gray-500">
                              {bill.customerPhone}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(bill.billDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          <br />
                          {new Date(bill.billDate).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{Number(bill.totalAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs"
                          >
                            {bill.paymentMode.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-primary hover:text-primary/90 hover:bg-purple-50"
                            onClick={() =>
                              window.open(
                                `/api/invoice/bill/${bill.billId}`,
                                "_blank"
                              )
                            }
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {billsTotalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing page {billsPage} of {billsTotalPages} ({billsTotal}{" "}
                  bills)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={billsPage <= 1}
                    onClick={() => loadBills(billsPage - 1, billSearch || undefined)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={billsPage >= billsTotalPages}
                    onClick={() => loadBills(billsPage + 1, billSearch || undefined)}
                    className="gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════
          VARIANT PICKER DIALOG
         ═══════════════════════════════════════════════════ */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Select Variant — {selectedProduct?.productName}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {selectedProduct.variants.map((variant) => {
                const price =
                  Number(selectedProduct.basePrice) +
                  (Number(variant.priceModifier) || 0);
                const outOfStock = variant.stockCount <= 0;
                return (
                  <button
                    key={variant.variantId}
                    onClick={() => addToCart(selectedProduct, variant)}
                    disabled={outOfStock}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
                      outOfStock
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "hover:border-primary hover:bg-purple-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: variant.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {variant.color} / {variant.size}
                        </p>
                        <p className="text-xs text-gray-500">
                          {variant.sku || "—"} · Stock: {variant.stockCount}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          BILL SUCCESS DIALOG
         ═══════════════════════════════════════════════════ */}
      <Dialog open={billSuccessOpen} onOpenChange={setBillSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Bill Created!
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Invoice <strong className="text-primary">{lastInvoiceNumber}</strong> has been
              generated successfully.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setBillSuccessOpen(false)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                New Bill
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 gap-1"
                onClick={() => {
                  window.open(`/api/invoice/bill/${lastBillId}`, "_blank");
                  setBillSuccessOpen(false);
                }}
              >
                <Printer className="w-4 h-4" />
                Print Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
