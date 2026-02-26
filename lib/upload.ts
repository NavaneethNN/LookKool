/**
 * Client-side upload helpers.
 * Replaces lib/supabase/upload.ts — uses our own /api/upload endpoint.
 */

export async function uploadImage(
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _bucket: string,
  folder: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }

  const { url } = await res.json();
  return url;
}

export async function deleteImage(
  publicUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _bucket?: string,
): Promise<void> {
  // Only delete images served from our /uploads/ path
  if (!publicUrl.startsWith("/uploads/")) return;

  await fetch("/api/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: publicUrl }),
  });
}
