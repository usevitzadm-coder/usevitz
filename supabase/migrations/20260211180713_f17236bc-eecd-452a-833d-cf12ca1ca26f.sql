
CREATE TRIGGER trigger_sync_order_status_on_payment_change
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_status_on_payment_change();
