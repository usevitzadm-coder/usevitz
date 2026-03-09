DROP TRIGGER IF EXISTS trigger_send_shipped_email ON public.orders;
DROP FUNCTION IF EXISTS public.send_shipped_email_on_tracking_update();
DROP EXTENSION IF EXISTS pg_net;