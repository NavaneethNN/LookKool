-- ============================================================================
-- 09_variant_pricing.sql
-- Add per-variant price and mrp columns to productvariants.
-- When set, these override the product's base_price / mrp.
-- When NULL, the product-level prices are used (backward compatible).
-- ============================================================================

-- Add nullable price/mrp columns
ALTER TABLE productvariants
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS mrp   NUMERIC(10, 2);

-- Migrate existing priceModifier values:
-- If a variant has a non-zero priceModifier, copy (base_price + priceModifier)
-- as the new variant price so existing data stays correct.
UPDATE productvariants v
SET price = (
  SELECT p.base_price::numeric + v.price_modifier::numeric
  FROM products p
  WHERE p.product_id = v.product_id
)
WHERE v.price_modifier <> 0
  AND v.price IS NULL;

COMMENT ON COLUMN productvariants.price IS 'Variant selling price. Overrides product.base_price when set.';
COMMENT ON COLUMN productvariants.mrp   IS 'Variant MRP. Overrides product.mrp when set.';
