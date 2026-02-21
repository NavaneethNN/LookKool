"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pipette, Upload } from "lucide-react";

interface ImageColorPickerProps {
  /** Current hex value e.g. "#FF0000" */
  value: string;
  /** Called with new hex value */
  onChange: (hex: string) => void;
  /** Optional: pre-loaded image URLs to pick from (e.g. variant images) */
  imageUrls?: string[];
}

export function ImageColorPicker({
  value,
  onChange,
  imageUrls = [],
}: ImageColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(
    imageUrls[0] ?? null
  );
  const [pickedColor, setPickedColor] = useState(value);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverColor, setHoverColor] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Draw image onto canvas when imgSrc changes
  useEffect(() => {
    if (!imgSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale to fit canvas (max 400×400)
      const maxW = 400;
      const maxH = 400;
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = (h * maxW) / w;
        w = maxW;
      }
      if (h > maxH) {
        w = (w * maxH) / h;
        h = maxH;
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = imgSrc;
  }, [imgSrc]);

  const getColor = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(
        ((e.clientX - rect.left) / rect.width) * canvas.width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / rect.height) * canvas.height
      );
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      return `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1]
        .toString(16)
        .padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
    },
    []
  );

  function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const hex = getColor(e);
    if (hex) {
      setHoverColor(hex);
      const rect = canvasRef.current!.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const hex = getColor(e);
    if (hex) {
      setPickedColor(hex);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleConfirm() {
    onChange(pickedColor);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Regular color input */}
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-14 p-1 cursor-pointer"
      />
      <span className="text-xs text-gray-500 font-mono w-16">{value}</span>

      {/* Eyedropper from image */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            title="Pick color from image"
          >
            <Pipette className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pick Color from Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image source buttons */}
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImgSrc(url)}
                  className={`w-12 h-12 rounded-lg border-2 overflow-hidden ${
                    imgSrc === url
                      ? "border-primary"
                      : "border-gray-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-primary/40"
              >
                <Upload className="w-4 h-4 text-gray-400" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Canvas */}
            {imgSrc ? (
              <div
                className="relative inline-block"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleCanvasMove}
                  onClick={handleCanvasClick}
                  className="rounded-lg cursor-crosshair border max-w-full"
                  style={{ imageRendering: "auto" }}
                />
                {/* Magnifier circle */}
                {isHovering && hoverColor && (
                  <div
                    className="pointer-events-none absolute w-10 h-10 rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: cursorPos.x - 20,
                      top: cursorPos.y - 50,
                      backgroundColor: hoverColor,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400 border rounded-lg">
                Upload an image or select from the thumbnails above
              </div>
            )}

            {/* Preview & confirm */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border shadow-inner"
                  style={{ backgroundColor: pickedColor }}
                />
                <span className="font-mono text-sm">{pickedColor}</span>
              </div>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-primary hover:bg-primary/90"
              >
                Use This Color
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
