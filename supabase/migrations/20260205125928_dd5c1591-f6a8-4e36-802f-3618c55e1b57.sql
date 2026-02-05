-- Add display_order column to products table for manual ordering
ALTER TABLE public.products 
ADD COLUMN display_order integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX idx_products_display_order ON public.products(display_order);

-- Initialize display_order based on current created_at order
WITH ordered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.products
)
UPDATE public.products p
SET display_order = op.rn
FROM ordered_products op
WHERE p.id = op.id;