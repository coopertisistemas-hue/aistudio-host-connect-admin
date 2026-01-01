-- Add Pricing and Sale status to Inventory Items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;

-- Add index for faster filtering of saleable items
CREATE INDEX IF NOT EXISTS idx_inventory_items_for_sale ON public.inventory_items(is_for_sale) WHERE is_for_sale = true;
