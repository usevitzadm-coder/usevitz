
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

  -- RESTORE stock: when payment was approved but now becomes refunded/rejected
  IF TG_OP = 'UPDATE' 
     AND OLD.payment_status = 'approved' 
     AND NEW.payment_status IN ('refunded', 'rejected') THEN
    FOR order_item IN
      SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      -- Check if this variant is a bundle
      SELECT EXISTS(
        SELECT 1 FROM bundle_variant_links WHERE bundle_variant_id = order_item.variant_id
      ) INTO is_bundle;

      IF is_bundle THEN
        -- Restore component stocks instead of bundle stock
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

        -- Bundle stock will be recalculated based on component min
        UPDATE product_variants pv
        SET stock = (
          SELECT COALESCE(MIN(cpv.stock), 0)
          FROM bundle_variant_links bvl
          JOIN product_variants cpv ON cpv.id = bvl.component_variant_id
          WHERE bvl.bundle_variant_id = order_item.variant_id
        )
        WHERE pv.id = order_item.variant_id;
      ELSE
        -- Regular product: restore directly
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

        -- Also restore linked bundle stocks
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

  RETURN NEW;
END;
$function$;
