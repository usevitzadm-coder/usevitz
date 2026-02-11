-- Update check constraint to include sale-related types
ALTER TABLE public.stock_movements DROP CONSTRAINT stock_movements_type_check;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_type_check CHECK (type = ANY (ARRAY['entrada'::text, 'saida'::text, 'ajuste'::text, 'venda'::text, 'venda_conjunto'::text, 'venda_componente'::text]));

-- Also update the trigger function to use the correct column name
CREATE OR REPLACE FUNCTION public.decrease_stock_on_payment_confirmed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  order_item RECORD;
BEGIN
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
        order_item.quantity,
        'venda',
        'Venda confirmada - Pedido #' || NEW.order_number
      );

      PERFORM sync_linked_stock(order_item.variant_id, order_item.quantity);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;