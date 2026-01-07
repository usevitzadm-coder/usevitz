-- 1. Create RPC function for admin check (defense-in-depth)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 2. Explicitly deny direct SELECT access to gift_cards table
-- All public lookups must go through get_gift_card_by_code() RPC
-- Admins already have full access via the existing "Admins can manage gift_cards" policy
CREATE POLICY "No direct gift card select for non-admins"
  ON public.gift_cards FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));