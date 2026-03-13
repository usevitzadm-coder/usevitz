
-- Fix trigger: only handle UPDATE cases (INSERT stock is handled in edge function code)
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
  -- NOTE: Stock deduction on INSERT is handled in the edge function code
  -- because order_items are inserted AFTER the order record.
  -- This trigger only handles UPDATE cases.

  -- ON UPDATE: Restore stock when payment becomes refunded/rejected
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

  -- ON UPDATE to approved: Update stock movement type from 'reserva' to 'venda'
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
