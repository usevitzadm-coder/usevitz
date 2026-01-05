-- Fix gift_cards RLS policies
-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view their own gift cards by email" ON public.gift_cards;

-- 2. Create a secure function to lookup gift cards by code (for CheckGiftCardPage)
CREATE OR REPLACE FUNCTION public.get_gift_card_by_code(_code TEXT)
RETURNS TABLE (
  code VARCHAR,
  current_balance NUMERIC,
  initial_value NUMERIC,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    gc.code,
    gc.current_balance,
    gc.initial_value,
    gc.expires_at,
    gc.is_active
  FROM gift_cards gc
  WHERE gc.code = _code;
$$;

-- 3. Create a secure function for gift card purchase (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.create_gift_card(
  _code VARCHAR,
  _initial_value NUMERIC,
  _purchaser_email TEXT,
  _purchaser_name TEXT,
  _recipient_email TEXT,
  _recipient_name TEXT,
  _recipient_message TEXT,
  _send_to_recipient BOOLEAN,
  _expires_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _gift_card_id UUID;
BEGIN
  INSERT INTO gift_cards (
    code,
    initial_value,
    current_balance,
    purchaser_email,
    purchaser_name,
    recipient_email,
    recipient_name,
    recipient_message,
    send_to_recipient,
    expires_at
  ) VALUES (
    _code,
    _initial_value,
    _initial_value,
    _purchaser_email,
    _purchaser_name,
    _recipient_email,
    _recipient_name,
    _recipient_message,
    _send_to_recipient,
    _expires_at
  )
  RETURNING id INTO _gift_card_id;

  -- Create the purchase transaction
  INSERT INTO gift_card_transactions (
    gift_card_id,
    amount,
    type,
    notes
  ) VALUES (
    _gift_card_id,
    _initial_value,
    'purchase',
    'Gift card purchased by ' || _purchaser_name
  );

  RETURN _gift_card_id;
END;
$$;

-- Fix gift_card_transactions RLS policies
-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view transactions for accessible gift cards" ON public.gift_card_transactions;