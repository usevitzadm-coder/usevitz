-- Function to decrease stock for order items when payment is confirmed
CREATE OR REPLACE FUNCTION public.decrease_stock_on_payment_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if payment_status changed to 'approved'
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    -- Decrease stock for each item in the order
    UPDATE product_variants pv
    SET stock = stock - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.variant_id = pv.id;

    -- Log stock movements for each item
    INSERT INTO stock_movements (variant_id, quantity, type, reason)
    SELECT 
      oi.variant_id,
      -oi.quantity,
      'sale',
      'Venda - Pedido #' || NEW.order_number
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.variant_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to fire after order payment status is updated
DROP TRIGGER IF EXISTS trigger_decrease_stock_on_payment ON orders;
CREATE TRIGGER trigger_decrease_stock_on_payment
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrease_stock_on_payment_confirmed();