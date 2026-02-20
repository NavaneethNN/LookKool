-- ============================================================
-- Migration: Site Appearance columns on store_settings
-- Run this in your Supabase SQL editor (or via drizzle-kit push)
-- ============================================================

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS site_logo_url       VARCHAR(500),
  ADD COLUMN IF NOT EXISTS site_primary_color  VARCHAR(20)  NOT NULL DEFAULT '#470B49',
  ADD COLUMN IF NOT EXISTS site_description    TEXT,
  ADD COLUMN IF NOT EXISTS footer_tagline      TEXT,
  ADD COLUMN IF NOT EXISTS nav_links_config    JSONB,
  ADD COLUMN IF NOT EXISTS footer_quick_links  JSONB,
  ADD COLUMN IF NOT EXISTS footer_help_links   JSONB,
  ADD COLUMN IF NOT EXISTS footer_legal_links  JSONB,
  ADD COLUMN IF NOT EXISTS footer_contact_phone  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS footer_contact_email  VARCHAR(150),
  ADD COLUMN IF NOT EXISTS footer_show_made_in_india BOOLEAN NOT NULL DEFAULT TRUE;
