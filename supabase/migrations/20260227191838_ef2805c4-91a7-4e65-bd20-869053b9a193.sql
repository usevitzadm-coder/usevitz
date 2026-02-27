
-- Newsletter leads table for footer signup (10% first purchase coupon)
CREATE TABLE public.newsletter_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'footer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_leads_email_unique UNIQUE (email)
);

ALTER TABLE public.newsletter_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter leads"
ON public.newsletter_leads FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_leads FOR INSERT
WITH CHECK (true);
