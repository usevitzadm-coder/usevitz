REVOKE ALL ON public.marketing_consents FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.marketing_consents TO service_role;
