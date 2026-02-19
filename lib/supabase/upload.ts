"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Upload a file to Supabase Storage and return its public URL.
 *
 * @param file      - File to upload
 * @param bucket    - Storage bucket name (e.g. "images")
 * @param folder    - Folder-like prefix (e.g. "categories" or "products/123")
 * @returns Public URL string
 */
export async function uploadImage(
  file: File,
  bucket: string,
  folder: string
): Promise<string> {
  const supabase = createClient();

  // Unique file name: folder/timestamp-random.ext
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
export async function deleteImage(
  publicUrl: string,
  bucket: string
): Promise<void> {
  const supabase = createClient();

  // Extract path from public URL:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(bucket).remove([path]);
}
