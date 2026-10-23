CREATE TABLE public.gymrats_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  accepted_terms_at timestamptz NOT NULL DEFAULT now(),
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.gymrats_signups TO anon;
GRANT SELECT, INSERT ON public.gymrats_signups TO authenticated;
GRANT ALL ON public.gymrats_signups TO service_role;
ALTER TABLE public.gymrats_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can sign up" ON public.gymrats_signups FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 2 AND 100 AND length(email) <= 255 AND length(phone) <= 20);
CREATE POLICY "Admins read signups" ON public.gymrats_signups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));