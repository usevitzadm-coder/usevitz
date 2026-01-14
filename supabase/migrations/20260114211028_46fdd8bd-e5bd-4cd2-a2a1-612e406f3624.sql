
-- Tabela para definir quais produtos formam um bundle (conjunto)
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_product_id, component_product_id),
  CHECK (bundle_product_id != component_product_id)
);

-- Tabela para vincular variantes específicas do bundle com variantes dos componentes
CREATE TABLE public.bundle_variant_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  component_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_variant_id, component_variant_id),
  CHECK (bundle_variant_id != component_variant_id)
);

-- Enable RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_variant_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_bundles
CREATE POLICY "Admins can manage product_bundles"
ON public.product_bundles
FOR ALL
USING (public.is_current_user_admin());

CREATE POLICY "Public can view product_bundles"
ON public.product_bundles
FOR SELECT
USING (true);

-- Políticas RLS para bundle_variant_links
CREATE POLICY "Admins can manage bundle_variant_links"
ON public.bundle_variant_links
FOR ALL
USING (public.is_current_user_admin());

CREATE POLICY "Public can view bundle_variant_links"
ON public.bundle_variant_links
FOR SELECT
USING (true);

-- Função para sincronizar estoque de bundles quando componentes são vendidos
CREATE OR REPLACE FUNCTION public.sync_bundle_stock_on_component_sale(
  p_component_variant_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bundle_link RECORD;
BEGIN
  -- Para cada bundle que contém este componente, decrementar o estoque
  FOR bundle_link IN
    SELECT bvl.bundle_variant_id, pv.stock
    FROM bundle_variant_links bvl
    JOIN product_variants pv ON pv.id = bvl.bundle_variant_id
    WHERE bvl.component_variant_id = p_component_variant_id
  LOOP
    -- Decrementar estoque do bundle (não pode ficar negativo)
    UPDATE product_variants
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = bundle_link.bundle_variant_id;
    
    -- Registrar movimentação de estoque
    INSERT INTO stock_movements (variant_id, quantity_change, reason, notes)
    VALUES (
      bundle_link.bundle_variant_id,
      -p_quantity,
      'venda_componente',
      'Estoque ajustado automaticamente pela venda de componente do conjunto'
    );
  END LOOP;
END;
$$;

-- Função para sincronizar estoque de componentes quando bundle é vendido
CREATE OR REPLACE FUNCTION public.sync_component_stock_on_bundle_sale(
  p_bundle_variant_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  component_link RECORD;
BEGIN
  -- Para cada componente deste bundle, decrementar o estoque
  FOR component_link IN
    SELECT bvl.component_variant_id, pv.stock
    FROM bundle_variant_links bvl
    JOIN product_variants pv ON pv.id = bvl.component_variant_id
    WHERE bvl.bundle_variant_id = p_bundle_variant_id
  LOOP
    -- Decrementar estoque do componente (não pode ficar negativo)
    UPDATE product_variants
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = component_link.component_variant_id;
    
    -- Registrar movimentação de estoque
    INSERT INTO stock_movements (variant_id, quantity_change, reason, notes)
    VALUES (
      component_link.component_variant_id,
      -p_quantity,
      'venda_conjunto',
      'Estoque ajustado automaticamente pela venda do conjunto'
    );
  END LOOP;
END;
$$;

-- Função para verificar se uma variante é bundle ou componente e sincronizar
CREATE OR REPLACE FUNCTION public.sync_linked_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_bundle BOOLEAN;
  is_component BOOLEAN;
BEGIN
  -- Verificar se é um bundle (tem componentes vinculados)
  SELECT EXISTS(
    SELECT 1 FROM bundle_variant_links WHERE bundle_variant_id = p_variant_id
  ) INTO is_bundle;
  
  -- Verificar se é um componente (está vinculado a algum bundle)
  SELECT EXISTS(
    SELECT 1 FROM bundle_variant_links WHERE component_variant_id = p_variant_id
  ) INTO is_component;
  
  -- Se for bundle, decrementar estoque dos componentes
  IF is_bundle THEN
    PERFORM sync_component_stock_on_bundle_sale(p_variant_id, p_quantity);
  END IF;
  
  -- Se for componente, decrementar estoque dos bundles
  IF is_component THEN
    PERFORM sync_bundle_stock_on_component_sale(p_variant_id, p_quantity);
  END IF;
END;
$$;

-- Atualizar o trigger existente para incluir sincronização de bundles
CREATE OR REPLACE FUNCTION public.decrease_stock_on_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_item RECORD;
BEGIN
  -- Só executar quando o status muda para 'approved'
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    -- Para cada item do pedido
    FOR order_item IN
      SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      -- Decrementar estoque da variante vendida
      UPDATE product_variants
      SET stock = GREATEST(0, stock - order_item.quantity)
      WHERE id = order_item.variant_id;
      
      -- Registrar movimentação de estoque
      INSERT INTO stock_movements (variant_id, quantity_change, reason, notes)
      VALUES (
        order_item.variant_id,
        -order_item.quantity,
        'venda',
        'Venda confirmada - Pedido #' || NEW.id
      );
      
      -- Sincronizar estoque de bundles/componentes vinculados
      PERFORM sync_linked_stock(order_item.variant_id, order_item.quantity);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar índices para melhor performance
CREATE INDEX idx_product_bundles_bundle_id ON public.product_bundles(bundle_product_id);
CREATE INDEX idx_product_bundles_component_id ON public.product_bundles(component_product_id);
CREATE INDEX idx_bundle_variant_links_bundle_id ON public.bundle_variant_links(bundle_variant_id);
CREATE INDEX idx_bundle_variant_links_component_id ON public.bundle_variant_links(component_variant_id);
