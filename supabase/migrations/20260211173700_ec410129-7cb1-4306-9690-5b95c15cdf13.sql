
CREATE OR REPLACE FUNCTION public.sync_order_status_on_payment_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Only act when payment_status actually changed
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF NEW.payment_status = 'approved' THEN
      NEW.status = 'confirmed';
    ELSIF NEW.payment_status = 'refunded' THEN
      NEW.status = 'cancelled';
    ELSIF NEW.payment_status IN ('pending', 'processing') THEN
      NEW.status = 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER sync_order_status_on_payment
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_status_on_payment_change();
