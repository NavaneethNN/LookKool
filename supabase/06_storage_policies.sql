-- =========================================================
-- LookKool — Supabase Storage Policies
-- =========================================================
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Before running, create the bucket in Dashboard → Storage:
--   Bucket name: products
--   Public: Yes
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- Public read access — anyone can view product images
-- ─────────────────────────────────────────────────────────

CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- ─────────────────────────────────────────────────────────
-- Admin-only upload/update/delete
-- ─────────────────────────────────────────────────────────

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND public.is_admin()
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND public.is_admin()
  );
