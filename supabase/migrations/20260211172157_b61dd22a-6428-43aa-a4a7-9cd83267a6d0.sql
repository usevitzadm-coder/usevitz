CREATE OR REPLACE FUNCTION public.sync_component_stock_on_bundle_sale(p_bundle_variant_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  component_link RECORD;
BEGIN
  FOR component_link IN
    SELECT bvl.component_variant_id, pv.stock
    FROM bundle_variant_links bvl
    JOIN product_variants pv ON pv.id = bvl.component_variant_id
    WHERE bvl.bundle_variant_id = p_bundle_variant_id
  LOOP
    UPDATE product_variants
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = component_link.component_variant_id;
    
    INSERT INTO stock_movements (variant_id, quantity, type, reason)
    VALUES (
      component_link.component_variant_id,
      p_quantity,
      'venda_conjunto',
      'Estoque ajustado automaticamente pela venda do conjunto'
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_bundle_stock_on_component_sale(p_component_variant_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bundle_link RECORD;
BEGIN
  FOR bundle_link IN
    SELECT bvl.bundle_variant_id, pv.stock
    FROM bundle_variant_links bvl
    JOIN product_variants pv ON pv.id = bvl.bundle_variant_id
    WHERE bvl.component_variant_id = p_component_variant_id
  LOOP
    UPDATE product_variants
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = bundle_link.bundle_variant_id;
    
    INSERT INTO stock_movements (variant_id, quantity, type, reason)
    VALUES (
      bundle_link.bundle_variant_id,
      p_quantity,
      'venda_componente',
      'Estoque ajustado automaticamente pela venda de componente do conjunto'
    );
  END LOOP;
END;
$function$;