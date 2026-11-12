CREATE TABLE public.marketing_consents (
  phone text PRIMARY KEY CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
  name text,
  email text,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  source text NOT NULL CHECK (source IN ('gymrats','cadastro','checkout','newsletter','minha_conta','whatsapp')),
  consent_text text
);
GRANT SELECT, INSERT, UPDATE ON public.marketing_consents TO service_role;
ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service functions manage WhatsApp consent" ON public.marketing_consents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX marketing_consents_changes_idx ON public.marketing_consents (updated_at, phone);
CREATE FUNCTION public.touch_marketing_consent() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END; $$;
CREATE TRIGGER touch_marketing_consent BEFORE UPDATE ON public.marketing_consents FOR EACH ROW EXECUTE FUNCTION public.touch_marketing_consent();

-- Import only explicit existing GymRats opt-ins. Preserve international E.164;
-- prefix Brazil's DDI for legacy local numbers and retain the ninth digit.
INSERT INTO public.marketing_consents (phone,name,email,whatsapp_opt_in,opted_in_at,source,consent_text)
SELECT DISTINCT ON (canonical_phone) canonical_phone,name,lower(email),true,created_at,'gymrats','Quero receber novidades, lançamentos e ofertas da Vitz por e-mail e WhatsApp. (opcional)'
FROM (
 SELECT *, CASE
 WHEN trim(phone) LIKE '+%' THEN '+' || regexp_replace(phone,'[^0-9]','','g')
 WHEN length(regexp_replace(phone,'[^0-9]','','g')) IN (10,11) THEN '+55' || regexp_replace(phone,'[^0-9]','','g')
 WHEN regexp_replace(phone,'[^0-9]','','g') LIKE '55%' AND length(regexp_replace(phone,'[^0-9]','','g')) IN (12,13) THEN '+' || regexp_replace(phone,'[^0-9]','','g')
 ELSE NULL END AS canonical_phone
 FROM public.gymrats_signups WHERE marketing_opt_in = true AND trim(phone) <> ''
) candidates WHERE canonical_phone ~ '^\+[1-9][0-9]{7,14}$'
ORDER BY canonical_phone,created_at DESC;

-- Called only by the service-role web function after input validation. A single
-- transaction saves the signup/newsletter and its explicit opt-in together.
CREATE FUNCTION public.submit_whatsapp_consent(_source text, _phone text, _name text, _email text, _opt_in boolean, _consent_text text) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF _source NOT IN ('gymrats','newsletter','cadastro','checkout') THEN RAISE EXCEPTION 'Invalid source'; END IF;
 IF _source = 'gymrats' THEN
  INSERT INTO public.gymrats_signups (name,email,phone,marketing_opt_in) VALUES (_name,_email,_phone,_opt_in);
 ELSIF _source = 'newsletter' THEN
  INSERT INTO public.newsletter_leads (email,source) VALUES (_email,'footer_cupom_primeira_compra') ON CONFLICT (email) DO NOTHING;
 END IF;
 IF _opt_in THEN
  INSERT INTO public.marketing_consents (phone,name,email,whatsapp_opt_in,opted_in_at,opted_out_at,source,consent_text)
  VALUES (_phone,_name,_email,true,clock_timestamp(),NULL,_source,_consent_text)
  ON CONFLICT (phone) DO UPDATE SET name = COALESCE(EXCLUDED.name,marketing_consents.name), email = EXCLUDED.email,
   whatsapp_opt_in = true,opted_in_at = EXCLUDED.opted_in_at,opted_out_at = NULL,source = EXCLUDED.source,consent_text = EXCLUDED.consent_text;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.submit_whatsapp_consent(text,text,text,text,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_whatsapp_consent(text,text,text,text,boolean,text) TO service_role;
