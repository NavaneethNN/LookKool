"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface GalleryImage {
  imageId: number;
  imagePath: string;
  altText: string | null;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  productName: string;
  label?: string | null;
}

// ── Component ────────────────────────────────────────────────

export function ImageGallery({ images, productName, label }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  function prevImage() {
    setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function nextImage() {
    setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentImageIndex].imagePath}
              alt={images[currentImageIndex].altText ?? productName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm hover:bg-white transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm hover:bg-white transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {label && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground shadow-sm">
            {label}
          </Badge>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.imageId}
              onClick={() => setCurrentImageIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                currentImageIndex === idx
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <Image
                src={img.imagePath}
                alt={img.altText ?? ""}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
