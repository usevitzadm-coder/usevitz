-- Create custom colors table
CREATE TABLE public.colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  hex_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on name
ALTER TABLE public.colors ADD CONSTRAINT colors_name_unique UNIQUE (name);

-- Enable RLS
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage colors"
ON public.colors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active colors"
ON public.colors FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_colors_updated_at
BEFORE UPDATE ON public.colors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default colors
INSERT INTO public.colors (name, hex_code, display_order) VALUES
  ('Preto', '#000000', 1),
  ('Branco', '#FFFFFF', 2),
  ('Bege', '#F5F5DC', 3),
  ('Verde', '#228B22', 4),
  ('Azul', '#4169E1', 5),
  ('Rosa', '#FF69B4', 6),
  ('Cinza', '#808080', 7);