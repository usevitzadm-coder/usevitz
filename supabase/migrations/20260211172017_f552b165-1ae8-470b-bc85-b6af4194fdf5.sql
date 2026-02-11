-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_decrease_stock_on_payment ON public.orders;

-- Recreate trigger to also fire on INSERT (for orders inserted with approved status)
CREATE TRIGGER trigger_decrease_stock_on_payment
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION decrease_stock_on_payment_confirmed();

-- Also update the function to handle INSERT (where OLD is NULL)
CREATE OR REPLACE FUNCTION public.decrease_stock_on_payment_confirmed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  order_item RECORD;
BEGIN
  -- Fire when payment_status is 'approved' and either:
  -- 1. It's a new INSERT with approved status, OR
  -- 2. It's an UPDATE where status changed to approved
  IF NEW.payment_status = 'approved' AND (TG_OP = 'INSERT' OR OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    FOR order_item IN
      SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      UPDATE product_variants
      SET stock = GREATEST(0, stock - order_item.quantity)
      WHERE id = order_item.variant_id;

      INSERT INTO stock_movements (variant_id, quantity, type, reason)
      VALUES (
        order_item.variant_id,
        -order_item.quantity,
        'venda',
        'Venda confirmada - Pedido #' || NEW.order_number
      );

      PERFORM sync_linked_stock(order_item.variant_id, order_item.quantity);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;