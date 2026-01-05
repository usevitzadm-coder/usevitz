-- Create gift_cards table
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(16) NOT NULL UNIQUE,
  initial_value NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_message TEXT,
  send_to_recipient BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_card_transactions table for tracking usage
CREATE TABLE public.gift_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund')),
  order_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_cards
CREATE POLICY "Admins can manage gift cards"
ON public.gift_cards
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view their own gift cards by email"
ON public.gift_cards
FOR SELECT
USING (true);

-- RLS Policies for gift_card_transactions
CREATE POLICY "Admins can manage gift card transactions"
ON public.gift_card_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view transactions for accessible gift cards"
ON public.gift_card_transactions
FOR SELECT
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_gift_cards_updated_at
BEFORE UPDATE ON public.gift_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for code lookup
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX idx_gift_cards_purchaser_email ON public.gift_cards(purchaser_email);
CREATE INDEX idx_gift_cards_recipient_email ON public.gift_cards(recipient_email);