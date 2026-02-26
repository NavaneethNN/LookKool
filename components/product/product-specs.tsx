"use client";

import { Droplets, Ruler, MapPin, Info } from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface ProductSpecsProps {
  product: {
    material: string | null;
    fabricWeight: string | null;
    careInstructions: string | null;
    origin: string | null;
    detailHtml: string | null;
  };
}

// ── Component ────────────────────────────────────────────────

export function ProductSpecs({ product }: ProductSpecsProps) {
  if (product.detailHtml) {
    return (
      <div
        className="prose prose-sm max-w-none text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: product.detailHtml }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {product.material && (
        <div className="flex items-center gap-3 text-sm">
          <Droplets className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Material:</span>
          <span className="font-medium">{product.material}</span>
        </div>
      )}
      {product.fabricWeight && (
        <div className="flex items-center gap-3 text-sm">
          <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Fabric Weight:</span>
          <span className="font-medium">{product.fabricWeight}</span>
        </div>
      )}
      {product.origin && (
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Origin:</span>
          <span className="font-medium">{product.origin}</span>
        </div>
      )}
      {product.careInstructions && (
        <div className="flex items-start gap-3 text-sm">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="text-muted-foreground">Care:</span>
            <p className="font-medium whitespace-pre-line">
              {product.careInstructions}
            </p>
          </div>
        </div>
      )}
      {!product.material &&
        !product.fabricWeight &&
        !product.origin &&
        !product.careInstructions && (
          <p className="text-sm text-muted-foreground italic">
            No details available.
          </p>
        )}
    </div>
  );
}
