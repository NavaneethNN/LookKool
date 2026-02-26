"use client";

import { useState, useRef, useCallback } from "react";
import { uploadImage, deleteImage } from "@/lib/upload";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
  /** Current image URL (or empty) */
  value: string;
  /** Called with the new public URL after upload, or "" on remove */
  onChange: (url: string) => void;
  /** Storage bucket */
  bucket?: string;
  /** Folder path inside the bucket */
  folder: string;
  /** CSS class for the container */
  className?: string;
  /** Width/height preview (px) */
  size?: number;
}

export function ImageUpload({
  value,
  onChange,
  bucket = "images",
  folder,
  className = "",
  size = 120,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB");
        return;
      }

      setUploading(true);
      try {
        const url = await uploadImage(file, bucket, folder);
        onChange(url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to upload image"
        );
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, onChange]
  );

  async function handleRemove() {
    if (!value) return;
    try {
      await deleteImage(value, bucket);
    } catch {
      // Ignore delete errors — file may already be gone
    }
    onChange("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className={className}>
      {value ? (
        <div className="relative inline-block group" style={{ width: size, height: size }}>
          <Image
            src={value}
            alt="Uploaded"
            width={size}
            height={size}
            className="rounded-lg border object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-gray-50 transition-colors"
          style={{ width: size, height: size }}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-[10px] text-gray-400">Upload</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Multi Image Upload  (for product variant images)
// ────────────────────────────────────────────────────────────────

type ImageAction =
  | { type: "add"; url: string }
  | { type: "remove"; id?: number; url: string }
  | { type: "primary"; id?: number; url: string };

interface MultiImage {
  url: string;
  isPrimary?: boolean;
  id?: number;
}

interface MultiImageUploadProps {
  images: MultiImage[];
  /** Action-based callback — called with each individual action */
  onChange: (action: ImageAction) => void;
  bucket?: string;
  folder: string;
  max?: number;
}

export function MultiImageUpload({
  images,
  onChange,
  bucket = "images",
  folder,
  max = 8,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );
    if (images.length + files.length > max) {
      toast.error(`Maximum ${max} images allowed`);
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file, bucket, folder);
        onChange({ type: "add", url });
      }
      toast.success(`${files.length} image(s) uploaded`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload images"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(img: MultiImage) {
    try {
      await deleteImage(img.url, bucket);
    } catch {
      // ignore storage error
    }
    onChange({ type: "remove", id: img.id, url: img.url });
  }

  function setPrimary(img: MultiImage) {
    onChange({ type: "primary", id: img.id, url: img.url });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((img, i) => (
        <div
          key={`${img.url}-${i}`}
          className={`relative group w-20 h-20 rounded-lg border-2 overflow-hidden ${
            img.isPrimary ? "border-primary" : "border-transparent"
          }`}
        >
          <Image
            src={img.url}
            alt=""
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            {!img.isPrimary && (
              <button
                type="button"
                onClick={() => setPrimary(img)}
                className="text-[9px] text-white bg-primary px-1.5 py-0.5 rounded"
              >
                Primary
              </button>
            )}
            <button
              type="button"
              onClick={() => handleRemove(img)}
              className="text-[9px] text-white bg-red-500 px-1.5 py-0.5 rounded"
            >
              Remove
            </button>
          </div>
          {img.isPrimary && (
            <div className="absolute top-0 left-0 bg-primary text-white text-[8px] px-1 py-0.5 rounded-br">
              ★
            </div>
          )}
        </div>
      ))}

      {images.length < max && (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-gray-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-4 h-4 text-gray-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">Add</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
