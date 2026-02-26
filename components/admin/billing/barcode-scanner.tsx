"use client";

import { forwardRef } from "react";
import { Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Props ─────────────────────────────────────────────────────

export interface BarcodeScannerProps {
  barcodeInput: string;
  onBarcodeInputChange: (value: string) => void;
  onBarcodeKeyDown: (e: React.KeyboardEvent) => void;
}

// ─── Component ─────────────────────────────────────────────────

export const BarcodeScanner = forwardRef<HTMLInputElement, BarcodeScannerProps>(
  function BarcodeScanner({ barcodeInput, onBarcodeInputChange, onBarcodeKeyDown }, ref) {
    return (
      <div className="relative">
        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
        <Input
          ref={ref}
          value={barcodeInput}
          onChange={(e) => onBarcodeInputChange(e.target.value)}
          onKeyDown={onBarcodeKeyDown}
          placeholder="Scan barcode or enter manually (press Enter)..."
          className="pl-10 h-11 text-base border-2 border-green-200 focus:border-green-500 bg-green-50/30"
        />
      </div>
    );
  }
);
