
CREATE OR REPLACE FUNCTION public.decrease_stock_on_payment_confirmed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  order_item RECORD;
BEGIN
  -- DEDUCT stock: when payment becomes approved (from any non-approved state)
  IF NEW.payment_status = 'approved' AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'approved') THEN
    FOR order_item IN
      SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      UPDATE product_variants
      SET stock = GREATEST(0, stock - order_item.quantity)
      WHERE id = order_item.variant_id;

      INSERT INTO stock_movements (variant_id, quantity, type, reason)
      VALUES (
        order_item.variant_id,
        order_item.quantity,
        'venda',
        'Venda confirmada - Pedido #' || NEW.order_number
      );

      PERFORM sync_linked_stock(order_item.variant_id, order_item.quantity);
    END LOOP;
  END IF;

  -- RESTORE stock: when payment was approved but now becomes refunded/rejected (order cancelled)
  IF TG_OP = 'UPDATE' 
     AND OLD.payment_status = 'approved' 
     AND NEW.payment_status IN ('refunded', 'rejected') THEN
    FOR order_item IN
      SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      UPDATE product_variants
      SET stock = stock + order_item.quantity
      WHERE id = order_item.variant_id;

      INSERT INTO stock_movements (variant_id, quantity, type, reason)
      VALUES (
        order_item.variant_id,
        order_item.quantity,
        'estorno',
        'Estoque restaurado - Pedido #' || NEW.order_number || ' cancelado/reembolsado'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Add 'estorno' to allowed stock movement types
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_type_check 
  CHECK (type IN ('entrada', 'saida', 'ajuste', 'venda', 'venda_conjunto', 'venda_componente', 'estorno'));
