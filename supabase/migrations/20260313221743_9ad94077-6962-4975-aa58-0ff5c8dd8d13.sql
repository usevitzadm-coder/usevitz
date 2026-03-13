
-- Drop and recreate the trigger function to handle stock on INSERT (any status)
-- and restore on UPDATE to refunded/rejected from any status
CREATE OR REPLACE FUNCTION public.decrease_stock_on_payment_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  order_item RECORD;
  is_bundle BOOLEAN;
  component_link RECORD;
BEGIN
  -- ON INSERT: Always deduct stock immediately to reserve it (pending, approved, etc.)
  IF TG_OP = 'INSERT' THEN
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
        'reserva',
        'Estoque reservado - Pedido #' || NEW.order_number
      );

      PERFORM sync_linked_stock(order_item.variant_id, order_item.quantity);
    END LOOP;
  END IF;

  -- ON UPDATE: Restore stock when payment becomes refunded/rejected (from any previous status)
  IF TG_OP = 'UPDATE' 
     AND OLD.payment_status NOT IN ('refunded', 'rejected')
     AND NEW.payment_status IN ('refunded', 'rejected') THEN
    FOR order_item IN
      SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM bundle_variant_links WHERE bundle_variant_id = order_item.variant_id
      ) INTO is_bundle;

      IF is_bundle THEN
        FOR component_link IN
          SELECT component_variant_id FROM bundle_variant_links 
          WHERE bundle_variant_id = order_item.variant_id
        LOOP
          UPDATE product_variants
          SET stock = stock + order_item.quantity
          WHERE id = component_link.component_variant_id;

          INSERT INTO stock_movements (variant_id, quantity, type, reason)
          VALUES (
            component_link.component_variant_id,
            order_item.quantity,
            'estorno',
            'Estoque restaurado (componente) - Pedido #' || NEW.order_number || ' cancelado'
          );
        END LOOP;

        UPDATE product_variants pv
        SET stock = (
          SELECT COALESCE(MIN(cpv.stock), 0)
          FROM bundle_variant_links bvl
          JOIN product_variants cpv ON cpv.id = bvl.component_variant_id
          WHERE bvl.bundle_variant_id = order_item.variant_id
        )
        WHERE pv.id = order_item.variant_id;
      ELSE
        UPDATE product_variants
        SET stock = stock + order_item.quantity
        WHERE id = order_item.variant_id;

        INSERT INTO stock_movements (variant_id, quantity, type, reason)
        VALUES (
          order_item.variant_id,
          order_item.quantity,
          'estorno',
          'Estoque restaurado - Pedido #' || NEW.order_number || ' cancelado'
        );

        FOR component_link IN
          SELECT bvl.bundle_variant_id FROM bundle_variant_links bvl 
          WHERE bvl.component_variant_id = order_item.variant_id
        LOOP
          UPDATE product_variants pv
          SET stock = (
            SELECT COALESCE(MIN(cpv.stock), 0)
            FROM bundle_variant_links bvl2
            JOIN product_variants cpv ON cpv.id = bvl2.component_variant_id
            WHERE bvl2.bundle_variant_id = component_link.bundle_variant_id
          )
          WHERE pv.id = component_link.bundle_variant_id;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- ON UPDATE to approved: Update stock movement type from 'reserva' to 'venda' (no stock change)
  IF TG_OP = 'UPDATE'
     AND OLD.payment_status IS DISTINCT FROM 'approved'
     AND NEW.payment_status = 'approved' THEN
    UPDATE stock_movements
    SET type = 'venda', reason = 'Venda confirmada - Pedido #' || NEW.order_number
    WHERE variant_id IN (SELECT variant_id FROM order_items WHERE order_id = NEW.id)
      AND type = 'reserva'
      AND reason LIKE '%Pedido #' || NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists for both INSERT and UPDATE on orders
DROP TRIGGER IF EXISTS trigger_decrease_stock_on_payment ON orders;
CREATE TRIGGER trigger_decrease_stock_on_payment
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrease_stock_on_payment_confirmed();
