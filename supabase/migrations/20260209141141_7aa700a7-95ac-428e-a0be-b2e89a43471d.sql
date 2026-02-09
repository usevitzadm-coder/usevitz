
-- Add is_coming_soon to products
ALTER TABLE public.products ADD COLUMN is_coming_soon boolean NOT NULL DEFAULT false;

-- Create launch_leads table
CREATE TABLE public.launch_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, email)
);

ALTER TABLE public.launch_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to launches"
  ON public.launch_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage launch leads"
  ON public.launch_leads FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
