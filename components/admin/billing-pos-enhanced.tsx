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
  Barcode,
  RotateCcw,
  ArrowLeftRight,
  MonitorSmartphone,
} from "lucide-react";
import { isTauriApp, printBill, getPrinters } from "@/lib/tauri-print";
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
import {
  searchByBarcode,
  createBillReturn,
  createBillPayments,
} from "@/lib/actions/billing-actions";

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
  id: string;
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
  itemDiscount: number; // per-item discount in ₹
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
  discountAmount: string;
  subtotal: string;
};

type SplitPayment = {
  paymentMode: string;
  amount: string;
  reference: string;
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
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [notes, setNotes] = useState("");

  // ── Split payments
  const [useSplitPayment, setUseSplitPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { paymentMode: "cash", amount: "", reference: "" },
  ]);

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

  // ── Barcode scanning
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Desktop print
  const [isDesktop, setIsDesktop] = useState(false);
  const [printers, setPrinters] = useState<{ name: string; is_default: boolean }[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");

  // Load printers on mount (desktop only)
  useEffect(() => {
    const desktop = isTauriApp();
    setIsDesktop(desktop);
    if (desktop) {
      getPrinters().then((list) => {
        setPrinters(list);
        const def = list.find((p) => p.is_default);
        if (def) setSelectedPrinter(def.name);
      });
    }
  }, []);

  // ── Return / Exchange
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnBillSearch, setReturnBillSearch] = useState("");
  const [returnBill, setReturnBill] = useState<InStoreBill | null>(null);
  const [returnBillItems, setReturnBillItems] = useState<Array<{
    variantId: number;
    productName: string;
    variant: string;
    quantity: number;
    maxQty: number;
    rate: number;
    selected: boolean;
    returnQty: number;
  }>>([]);
  const [returnType, setReturnType] = useState<"return" | "exchange">("return");
  const [returnReason, setReturnReason] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);

  // ── Hold bills
  const [heldBills, setHeldBills] = useState<Array<{ cart: CartItem[]; customer: { name: string; phone: string; gstin: string }; discount: string; notes: string; heldAt: string }>>([]);
  const [holdListOpen, setHoldListOpen] = useState(false);

  // ── Config
  const gstRate = Number(storeConfig.gstRate) || 5;
  const hsnCode = storeConfig.hsnCode || "6104";
  const enableGst = storeConfig.enableGst;

  // ─── Barcode scan handler ────────────────────────
  const handleBarcodeScan = useCallback(async (code: string) => {
    if (!code || code.length < 3) return;
    try {
      const result = await searchByBarcode(code);
      if (!result) {
        toast.error("Product not found for barcode: " + code);
        return;
      }

      const key = `${result.productId}-${result.variantId}`;
      const price = Number(result.variantPrice || result.basePrice) + (Number(result.priceModifier) || 0);
      const mrp = Number(result.variantMrp || result.mrp) + (Number(result.priceModifier) || 0);

      setCart((prev) => {
        const existing = prev.find((c) => c.id === key);
        if (existing) {
          if (existing.quantity >= result.stockCount) {
            toast.error("Max stock reached");
            return prev;
          }
          return prev.map((c) =>
            c.id === key ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        if (result.stockCount <= 0) {
          toast.error("Out of stock");
          return prev;
        }
        return [
          ...prev,
          {
            id: key,
            productId: result.productId,
            variantId: result.variantId,
            productName: result.productName,
            color: result.color,
            size: result.size,
            sku: result.sku,
            price,
            mrp,
            quantity: 1,
            maxStock: result.stockCount,
            hsn: hsnCode,
            itemDiscount: 0,
          },
        ];
      });

      toast.success(`Added: ${result.productName} (${result.color}/${result.size})`);
    } catch {
      toast.error("Barcode scan failed");
    }
  }, [hsnCode]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  // ─── Keyboard shortcuts (professional billing) ─────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "F2" && !isInput) {
        // F2 → Focus search bar
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F3" && !isInput) {
        // F3 → Focus barcode scanner
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === "F5") {
        // F5 → New bill (clear cart)
        e.preventDefault();
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerGstin("");
        setDiscount("");
        setDiscountType("flat");
        setNotes("");
        setPaymentMode("cash");
        setUseSplitPayment(false);
        setSplitPayments([{ paymentMode: "cash", amount: "", reference: "" }]);
        toast.info("New bill started");
      } else if (e.key === "F9") {
        // F9 → Toggle held bills
        e.preventDefault();
        setHoldListOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
    } catch {
      toast.error("Search failed");
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
          itemDiscount: 0,
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
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
      return;
    }
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

  const updateItemDiscount = (id: string, discountVal: number) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, itemDiscount: Math.max(0, discountVal) } : c))
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
    setDiscountType("flat");
    setNotes("");
    setPaymentMode("cash");
    setUseSplitPayment(false);
    setSplitPayments([{ paymentMode: "cash", amount: "", reference: "" }]);
  };

  // ─── Hold / Resume bill ───────────────────────────
  const holdBill = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setHeldBills(prev => [...prev, {
      cart: [...cart],
      customer: { name: customerName, phone: customerPhone, gstin: customerGstin },
      discount,
      notes,
      heldAt: new Date().toLocaleTimeString("en-IN"),
    }]);
    clearCart();
    toast.success("Bill held");
  };

  const resumeBill = (index: number) => {
    const held = heldBills[index];
    setCart(held.cart);
    setCustomerName(held.customer.name);
    setCustomerPhone(held.customer.phone);
    setCustomerGstin(held.customer.gstin);
    setDiscount(held.discount);
    setNotes(held.notes);
    setHeldBills(prev => prev.filter((_, i) => i !== index));
    setHoldListOpen(false);
    toast.success("Bill resumed");
  };

  // ─── Calculations ─────────────────────────────────
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const totalItemDiscount = cart.reduce((sum, c) => sum + c.itemDiscount * c.quantity, 0);
  const afterItemDiscount = subtotal - totalItemDiscount;

  const billDiscountAmt = discountType === "percent"
    ? afterItemDiscount * (Number(discount) || 0) / 100
    : Number(discount) || 0;
  const totalDiscountAmt = totalItemDiscount + billDiscountAmt;
  const afterDiscount = afterItemDiscount - billDiscountAmt;

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

    // Validate split payments
    if (useSplitPayment) {
      const splitTotal = splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      if (Math.abs(splitTotal - roundedTotal) > 1) {
        toast.error(`Split payments (₹${splitTotal}) don't match total (₹${roundedTotal})`);
        return;
      }
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
        itemDiscount: c.itemDiscount,
        amount: (c.price - c.itemDiscount) * c.quantity,
      }));

      const bill = await createInStoreBill({
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerGstin: customerGstin || undefined,
        subtotal: subtotal.toFixed(2),
        discountAmount: totalDiscountAmt.toFixed(2),
        taxableAmount: taxableAmount.toFixed(2),
        cgstRate: enableGst ? cgstRate.toFixed(2) : "0.00",
        cgstAmount: enableGst ? cgstAmount.toFixed(2) : "0.00",
        sgstRate: enableGst ? sgstRate.toFixed(2) : "0.00",
        sgstAmount: enableGst ? sgstAmount.toFixed(2) : "0.00",
        igstRate: "0.00",
        igstAmount: "0.00",
        roundOff: roundOff.toFixed(2),
        totalAmount: roundedTotal.toFixed(2),
        paymentMode: useSplitPayment ? "split" : paymentMode,
        items: JSON.stringify(itemsPayload),
        notes: notes || undefined,
      });

      // Save split payments if used
      if (useSplitPayment && splitPayments.length > 0) {
        await createBillPayments(bill.billId, splitPayments.filter(p => Number(p.amount) > 0));
      }

      setLastBillId(bill.billId);
      setLastInvoiceNumber(bill.invoiceNumber);
      setBillSuccessOpen(true);
      clearCart();
      toast.success("Bill created successfully!");
    } catch {
      toast.error("Failed to create bill");
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
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoadingBills(false);
    }
  }, []);

  const handleBillSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillSearch(e.target.value);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadBills(1, billSearch || undefined);
    }, 400);
    return () => clearTimeout(t);
  }, [billSearch, loadBills]);

  // ─── Return / Exchange ────────────────────────────
  const openReturnDialog = () => {
    setReturnBillSearch("");
    setReturnBill(null);
    setReturnBillItems([]);
    setReturnType("return");
    setReturnReason("");
    setReturnDialogOpen(true);
  };

  const searchReturnBill = async () => {
    if (!returnBillSearch.trim()) return;
    try {
      const result = await getInStoreBills({ search: returnBillSearch });
      if (result.bills.length === 0) {
        toast.error("No bill found");
        return;
      }
      const bill = result.bills[0] as unknown as InStoreBill;
      setReturnBill(bill);

      try {
        const items = JSON.parse(bill.items) as Array<{
          variantId?: number;
          productName: string;
          variant: string;
          quantity: number;
          rate: number;
        }>;
        setReturnBillItems(items.map(i => ({
          variantId: i.variantId || 0,
          productName: i.productName,
          variant: i.variant,
          quantity: i.quantity,
          maxQty: i.quantity,
          rate: i.rate,
          selected: false,
          returnQty: 0,
        })));
      } catch {
        toast.error("Could not parse bill items");
      }
    } catch {
      toast.error("Search failed");
    }
  };

  const handleProcessReturn = async () => {
    if (!returnBill) return;
    const selectedItems = returnBillItems.filter(i => i.selected && i.returnQty > 0);
    if (selectedItems.length === 0) { toast.error("Select items to return"); return; }

    const refundAmount = selectedItems.reduce((s, i) => s + i.rate * i.returnQty, 0);

    setProcessingReturn(true);
    try {
      await createBillReturn({
        originalBillId: returnBill.billId,
        returnType: returnType,
        returnedItems: selectedItems.map(i => ({
          variantId: i.variantId,
          productName: i.productName,
          variant: i.variant,
          quantity: i.returnQty,
          rate: i.rate,
        })),
        refundAmount: refundAmount.toFixed(2),
        reason: returnReason || undefined,
      });

      if (returnType === "exchange") {
        // Add returned items credit to discount and switch to new bill
        setDiscount(refundAmount.toFixed(2));
        setDiscountType("flat");
        setNotes(`Exchange from bill ${returnBill.invoiceNumber}. Credit: ₹${refundAmount.toFixed(2)}`);
        toast.success("Return processed — credit applied. Add new items for exchange.");
      } else {
        toast.success(`Refund of ₹${refundAmount.toFixed(2)} processed. Stock restored.`);
      }

      setReturnDialogOpen(false);
    } catch {
      toast.error("Failed to process return");
    } finally {
      setProcessingReturn(false);
    }
  };

  // ─── Split payment helpers ────────────────────────
  const addSplitPayment = () => {
    setSplitPayments(prev => [...prev, { paymentMode: "cash", amount: "", reference: "" }]);
  };

  const removeSplitPayment = (idx: number) => {
    setSplitPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSplitPayment = (idx: number, field: keyof SplitPayment, value: string) => {
    setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const splitPaymentTotal = splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="h-full">
      <Tabs defaultValue="new-bill" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new-bill" className="gap-2">
            <Receipt className="w-4 h-4" />
            New Bill
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" onClick={() => loadBills(1)}>
            <ShoppingBag className="w-4 h-4" />
            Bill History
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════
            NEW BILL TAB
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="new-bill">
          {/* Action toolbar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Button variant="outline" size="sm" onClick={holdBill} disabled={cart.length === 0} className="gap-1.5 text-xs">
              ⏸ Hold Bill
            </Button>
            {heldBills.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setHoldListOpen(true)} className="gap-1.5 text-xs">
                📋 Held ({heldBills.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={openReturnDialog} className="gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50">
              <RotateCcw className="w-3.5 h-3.5" /> Return/Exchange
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Left: Product search & cart ────────────────── */}
            <div className="xl:col-span-2 space-y-4">
              {/* Barcode scanner input */}
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                <Input
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Scan barcode or enter manually (press Enter)..."
                  className="pl-10 h-11 text-base border-2 border-green-200 focus:border-green-500 bg-green-50/30"
                />
              </div>

              {/* Product name search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products by name or code..."
                  className="pl-10 h-12 text-base border-2 focus:border-primary"
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
                    const inStockVariants = product.variants.filter((v) => v.stockCount > 0);
                    return (
                      <button
                        key={product.productId}
                        onClick={() => handleProductClick(product)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                          <p className="text-xs text-gray-500">Code: {product.productCode} · {inStockVariants.length} variant(s) in stock</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-semibold text-gray-900">₹{Number(product.basePrice).toLocaleString("en-IN")}</p>
                          {Number(product.mrp) > Number(product.basePrice) && (
                            <p className="text-xs text-gray-400 line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</p>
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
                  <h3 className="text-sm font-semibold text-gray-900">Cart ({cart.length} items)</h3>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </Button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Cart is empty</p>
                    <p className="text-xs mt-1">Scan barcode or search products above</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{item.color} / {item.size}</span>
                            {item.sku && <span className="text-xs text-gray-400">SKU: {item.sku}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">₹{item.price.toLocaleString("en-IN")} × {item.quantity}</span>
                            {/* Per-item discount */}
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">Disc:</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={item.itemDiscount || ""}
                                onChange={(e) => updateItemDiscount(item.id, Number(e.target.value) || 0)}
                                className="w-14 h-5 text-xs border rounded px-1 text-center"
                                placeholder="₹0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 transition-colors"
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0 w-20">
                          <p className="text-sm font-semibold text-gray-900">₹{((item.price - item.itemDiscount) * item.quantity).toLocaleString("en-IN")}</p>
                          {item.itemDiscount > 0 && (
                            <p className="text-xs text-green-600 line-through">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                          )}
                        </div>

                        {/* Remove */}
                        <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
                  <User className="w-4 h-4" /> Customer Details
                  <span className="text-xs font-normal text-gray-400">(optional)</span>
                </div>
                <div className="space-y-3">
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="h-10" />
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" className="h-10" />
                  <Input value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())} placeholder="GSTIN (for B2B)" className="h-10" maxLength={15} />
                </div>
              </div>

              {/* Payment & Discount */}
              <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <IndianRupee className="w-4 h-4" /> Payment
                </div>
                <div className="space-y-3">
                  {/* Split payment toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500">Split Payment</label>
                    <button
                      onClick={() => setUseSplitPayment(!useSplitPayment)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${useSplitPayment ? "bg-primary" : "bg-gray-200"}`}
                    >
                      <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${useSplitPayment ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  {!useSplitPayment ? (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Payment Mode</label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {splitPayments.map((sp, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select value={sp.paymentMode} onValueChange={(v) => updateSplitPayment(idx, "paymentMode", v)}>
                            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number" min="0" step="0.01" placeholder="₹ Amount"
                            value={sp.amount}
                            onChange={(e) => updateSplitPayment(idx, "amount", e.target.value)}
                            className="h-8 text-xs flex-1"
                          />
                          {splitPayments.length > 1 && (
                            <button onClick={() => removeSplitPayment(idx)} className="text-red-400 hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={addSplitPayment} className="text-xs h-7">+ Add</Button>
                        <span className={`text-xs font-medium ${Math.abs(splitPaymentTotal - roundedTotal) > 1 ? "text-red-500" : "text-green-600"}`}>
                          ₹{splitPaymentTotal.toFixed(0)} / ₹{roundedTotal}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Discount</label>
                    <div className="flex gap-2">
                      <Input
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10 flex-1"
                      />
                      <Select value={discountType} onValueChange={(v) => setDiscountType(v as "flat" | "percent")}>
                        <SelectTrigger className="h-10 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">₹</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="h-10" />
                  </div>
                </div>
              </div>

              {/* Totals summary */}
              <div className="rounded-xl border bg-white shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Bill Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.reduce((s, c) => s + c.quantity, 0)} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {totalItemDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Item Discounts</span>
                      <span>−₹{totalItemDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {billDiscountAmt > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Bill Discount {discountType === "percent" ? `(${discount}%)` : ""}</span>
                      <span>−₹{billDiscountAmt.toFixed(2)}</span>
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
                      <span>{roundOff >= 0 ? "+" : ""}₹{roundOff.toFixed(2)}</span>
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

                {/* Keyboard shortcuts strip */}
                {isDesktop && (
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F2</kbd> Search</span>
                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F3</kbd> Barcode</span>
                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F5</kbd> New Bill</span>
                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">F9</kbd> Held Bills</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            BILL HISTORY TAB
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="history">
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={billSearch} onChange={handleBillSearchChange} placeholder="Search by invoice #, name, or phone..." className="pl-10" />
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700">Invoice #</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Payment</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingBills ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading bills...</td></tr>
                  ) : bills.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bills found</td></tr>
                  ) : (
                    bills.map((bill) => (
                      <tr key={bill.billId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{bill.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{bill.customerName || "Walk-in"}</p>
                          {bill.customerPhone && <p className="text-xs text-gray-500">{bill.customerPhone}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(bill.billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          <br />{new Date(bill.billDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{Number(bill.totalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize text-xs">{bill.paymentMode.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/90 hover:bg-purple-50"
                              onClick={() => printBill(bill.billId)}>
                              <Printer className="w-3.5 h-3.5" /> Print
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {billsTotalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Page {billsPage} of {billsTotalPages} ({billsTotal} bills)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={billsPage <= 1} onClick={() => loadBills(billsPage - 1, billSearch || undefined)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={billsPage >= billsTotalPages} onClick={() => loadBills(billsPage + 1, billSearch || undefined)} className="gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════ VARIANT PICKER DIALOG ═══════ */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Select Variant — {selectedProduct?.productName}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {selectedProduct.variants.map((variant) => {
                const price = Number(selectedProduct.basePrice) + (Number(variant.priceModifier) || 0);
                const outOfStock = variant.stockCount <= 0;
                return (
                  <button key={variant.variantId} onClick={() => addToCart(selectedProduct, variant)} disabled={outOfStock}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${outOfStock ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-primary hover:bg-purple-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: variant.color }} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{variant.color} / {variant.size}</p>
                        <p className="text-xs text-gray-500">{variant.sku || "—"} · Stock: {variant.stockCount}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₹{price.toLocaleString("en-IN")}</span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════ BILL SUCCESS DIALOG ═══════ */}
      <Dialog open={billSuccessOpen} onOpenChange={setBillSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Bill Created!</h3>
            <p className="text-sm text-gray-500 mb-4">Invoice <strong className="text-primary">{lastInvoiceNumber}</strong> has been generated successfully.</p>
            <div className="flex flex-col gap-3 w-full">
              {isDesktop && printers.length > 0 && (
                <div className="flex items-center gap-2 w-full">
                  <MonitorSmartphone className="w-4 h-4 text-green-600 shrink-0" />
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="flex-1 text-xs border rounded-md px-2 py-1.5 bg-white"
                  >
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}{p.is_default ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setBillSuccessOpen(false)} className="gap-1">
                  <Plus className="w-4 h-4" /> New Bill
                </Button>
                <Button className="bg-primary hover:bg-primary/90 gap-1" onClick={() => { printBill(lastBillId!, isDesktop && selectedPrinter ? { printerName: selectedPrinter, thermal: selectedPrinter.toLowerCase().includes('thermal') || selectedPrinter.toLowerCase().includes('pos') || selectedPrinter.toLowerCase().includes('receipt') } : undefined); setBillSuccessOpen(false); }}>
                  <Printer className="w-4 h-4" /> Print Bill
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ RETURN / EXCHANGE DIALOG ═══════ */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" /> Return / Exchange
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search original bill */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Find Original Bill</label>
              <div className="flex gap-2">
                <Input value={returnBillSearch} onChange={(e) => setReturnBillSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchReturnBill()}
                  placeholder="Enter invoice # or phone..." className="flex-1" />
                <Button onClick={searchReturnBill} className="bg-primary hover:bg-primary/90">Search</Button>
              </div>
            </div>

            {returnBill && (
              <>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary font-mono font-medium">{returnBill.invoiceNumber}</span>
                    <span className="font-semibold">₹{Number(returnBill.totalAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {returnBill.customerName || "Walk-in"} · {new Date(returnBill.billDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {/* Return type */}
                <div className="flex gap-3">
                  <button onClick={() => setReturnType("return")}
                    className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${returnType === "return" ? "border-orange-500 bg-orange-50 text-orange-700" : "hover:bg-gray-50"}`}>
                    <RotateCcw className="w-4 h-4 mx-auto mb-1" /> Refund Return
                  </button>
                  <button onClick={() => setReturnType("exchange")}
                    className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${returnType === "exchange" ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}>
                    <ArrowLeftRight className="w-4 h-4 mx-auto mb-1" /> Exchange
                  </button>
                </div>

                {/* Select items to return */}
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2 w-8"></th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-700">Product</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center">Bought</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center">Return Qty</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-700 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {returnBillItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={item.selected}
                              onChange={(e) => setReturnBillItems(prev => prev.map((p, i) => i === idx ? { ...p, selected: e.target.checked, returnQty: e.target.checked ? 1 : 0 } : p))} />
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-xs font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.variant}</p>
                          </td>
                          <td className="px-3 py-2 text-center text-xs">{item.maxQty}</td>
                          <td className="px-3 py-2 text-center">
                            {item.selected ? (
                              <Input type="number" min={1} max={item.maxQty}
                                value={item.returnQty}
                                onChange={(e) => setReturnBillItems(prev => prev.map((p, i) => i === idx ? { ...p, returnQty: Math.min(Number(e.target.value), item.maxQty) } : p))}
                                className="h-7 w-14 text-xs text-center mx-auto" />
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-medium">
                            {item.selected && item.returnQty > 0 ? `₹${(item.rate * item.returnQty).toFixed(2)}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Refund summary */}
                {returnBillItems.some(i => i.selected && i.returnQty > 0) && (
                  <div className="bg-orange-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span>{returnType === "exchange" ? "Exchange Credit" : "Refund Amount"}</span>
                      <span className="text-orange-700">
                        ₹{returnBillItems.filter(i => i.selected && i.returnQty > 0).reduce((s, i) => s + i.rate * i.returnQty, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Reason for return/exchange (optional)" />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleProcessReturn} disabled={processingReturn}
                    className={returnType === "exchange" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}>
                    {processingReturn ? "Processing..." : returnType === "exchange" ? "Process Exchange" : "Process Return"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ HELD BILLS DIALOG ═══════ */}
      <Dialog open={holdListOpen} onOpenChange={setHoldListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Held Bills</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {heldBills.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No held bills</p>
            ) : (
              heldBills.map((held, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {held.customer.name || "Walk-in"} · {held.cart.length} items
                    </p>
                    <p className="text-xs text-gray-500">
                      Held at {held.heldAt} · ₹{held.cart.reduce((s, c) => s + c.price * c.quantity, 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => resumeBill(idx)} className="bg-primary hover:bg-primary/90">
                    Resume
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
