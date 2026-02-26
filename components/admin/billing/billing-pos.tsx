"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  ShoppingBag,
  MonitorSmartphone,
} from "lucide-react";
import { isTauriApp, printBill, getPrinters } from "@/lib/tauri-print";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { searchProductsForBilling } from "@/lib/actions/product.actions";
import { createInStoreBill, getInStoreBills } from "@/lib/actions/bill.actions";
import { searchByBarcode } from "@/lib/actions/inventory.actions";
import {
  createBillReturn,
  createBillPayments,
} from "@/lib/actions/bill-return.actions";

import type {
  Variant,
  SearchProduct,
  CartItem,
  InStoreBill,
  SplitPayment,
  StoreConfig,
  HeldBill,
} from "./types";
import type { ReturnBillItem } from "./return-exchange-dialog";

import { BarcodeScanner } from "./barcode-scanner";
import { CartItemsList, BillSummary } from "./billing-cart";
import { CustomerInfoForm } from "./customer-info-form";
import { PaymentSection } from "./payment-section";
import { ReturnExchangeDialog } from "./return-exchange-dialog";
import { BillHistory } from "./bill-history";
import { HeldBillsPanel } from "./held-bills-panel";

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
  const [returnBillItems, setReturnBillItems] = useState<ReturnBillItem[]>([]);
  const [returnType, setReturnType] = useState<"return" | "exchange">("return");
  const [returnReason, setReturnReason] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);

  // ── Hold bills
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Barcode scan failed");
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
    const price = Number(variant.price || product.basePrice) + (Number(variant.priceModifier) || 0);
    const mrp = Number(variant.mrp || product.mrp) + (Number(variant.priceModifier) || 0);

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
      prev.map((c) => (c.id === id ? { ...c, itemDiscount: Math.min(c.price, Math.max(0, discountVal)) } : c))
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

  const rawBillDiscount = discountType === "percent"
    ? afterItemDiscount * Math.min(Number(discount) || 0, 100) / 100
    : Number(discount) || 0;
  const billDiscountAmt = Math.min(rawBillDiscount, afterItemDiscount); // Cap: can't exceed subtotal
  const totalDiscountAmt = totalItemDiscount + billDiscountAmt;
  const afterDiscount = Math.max(0, afterItemDiscount - billDiscountAmt);

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
          itemDiscount?: number;
        }>;
        setReturnBillItems(items.map(i => ({
          variantId: i.variantId || 0,
          productName: i.productName,
          variant: i.variant,
          quantity: i.quantity,
          maxQty: i.quantity,
          rate: i.rate - (i.itemDiscount || 0), // effective rate after item discount
          selected: false,
          returnQty: 0,
        })));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not parse bill items");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process return");
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
              <BarcodeScanner
                ref={barcodeInputRef}
                barcodeInput={barcodeInput}
                onBarcodeInputChange={setBarcodeInput}
                onBarcodeKeyDown={handleBarcodeKeyDown}
              />

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

              {/* Cart items list */}
              <CartItemsList
                cart={cart}
                onUpdateQty={updateQty}
                onUpdateItemDiscount={updateItemDiscount}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
              />
            </div>

            {/* ── Right: Customer info & totals ──────────────── */}
            <div className="space-y-4">
              {/* Customer details */}
              <CustomerInfoForm
                customerName={customerName}
                customerPhone={customerPhone}
                customerGstin={customerGstin}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
                onCustomerGstinChange={setCustomerGstin}
              />

              {/* Payment & Discount */}
              <PaymentSection
                useSplitPayment={useSplitPayment}
                onToggleSplitPayment={() => setUseSplitPayment(!useSplitPayment)}
                paymentMode={paymentMode}
                onPaymentModeChange={setPaymentMode}
                splitPayments={splitPayments}
                onAddSplitPayment={addSplitPayment}
                onRemoveSplitPayment={removeSplitPayment}
                onUpdateSplitPayment={updateSplitPayment}
                splitPaymentTotal={splitPaymentTotal}
                roundedTotal={roundedTotal}
                discount={discount}
                onDiscountChange={setDiscount}
                discountType={discountType}
                onDiscountTypeChange={setDiscountType}
                notes={notes}
                onNotesChange={setNotes}
              />

              {/* Bill Summary & Totals */}
              <BillSummary
                cart={cart}
                subtotal={subtotal}
                totalItemDiscount={totalItemDiscount}
                billDiscountAmt={billDiscountAmt}
                discount={discount}
                discountType={discountType}
                enableGst={enableGst}
                taxableAmount={taxableAmount}
                cgstRate={cgstRate}
                cgstAmount={cgstAmount}
                sgstRate={sgstRate}
                sgstAmount={sgstAmount}
                roundOff={roundOff}
                roundedTotal={roundedTotal}
                submitting={submitting}
                onCreateBill={handleCreateBill}
                isDesktop={isDesktop}
              />
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            BILL HISTORY TAB
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="history">
          <BillHistory
            bills={bills}
            billSearch={billSearch}
            onBillSearchChange={handleBillSearchChange}
            loadingBills={loadingBills}
            billsPage={billsPage}
            billsTotalPages={billsTotalPages}
            billsTotal={billsTotal}
            onLoadBills={loadBills}
          />
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
                const price = Number(variant.price || selectedProduct.basePrice) + (Number(variant.priceModifier) || 0);
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
      <ReturnExchangeDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        returnBillSearch={returnBillSearch}
        onReturnBillSearchChange={setReturnBillSearch}
        onSearchReturnBill={searchReturnBill}
        returnBill={returnBill}
        returnBillItems={returnBillItems}
        onReturnBillItemsChange={setReturnBillItems}
        returnType={returnType}
        onReturnTypeChange={setReturnType}
        returnReason={returnReason}
        onReturnReasonChange={setReturnReason}
        processingReturn={processingReturn}
        onProcessReturn={handleProcessReturn}
      />

      {/* ═══════ HELD BILLS DIALOG ═══════ */}
      <HeldBillsPanel
        open={holdListOpen}
        onOpenChange={setHoldListOpen}
        heldBills={heldBills}
        onResumeBill={resumeBill}
      />
    </div>
  );
}
