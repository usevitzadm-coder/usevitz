

## Diagnóstico: Por que o estoque não esgota corretamente

### Problemas identificados

**1. Sem validação de estoque no checkout (servidor)**
A função `create-pagarme-checkout` valida preço, cupom e gift card, mas **nunca verifica se há estoque disponível** antes de criar o pedido. Um produto com 0 unidades pode ser comprado.

**2. Pedidos pendentes (PIX/boleto) não reservam estoque**
O trigger `decrease_stock_on_payment_confirmed` só decrementa estoque quando `payment_status = 'approved'`. Pedidos PIX e boleto ficam como `pending` até o webhook confirmar pagamento. Nesse intervalo:
- Cliente A compra via PIX → estoque NÃO decrementado (pending)
- Cliente B compra o mesmo item via PIX → estoque NÃO decrementado (ainda aparece disponível)
- Ambos pagam → estoque deveria ter esgotado após o primeiro, mas permitiu oversell

**3. Frontend confia apenas no `product_variants.stock`**
O frontend verifica `selectedVariant.stock === 0` para mostrar "Esgotado", mas esse valor não considera pedidos pendentes.

### Solução proposta

**A. Validação de estoque no checkout (servidor) — `create-pagarme-checkout/index.ts`**
Após validar preços, buscar as variantes e verificar se `stock >= quantity` para cada item. Rejeitar o pedido com erro claro se algum item está esgotado. Isso previne compras de itens com estoque zero.

**B. Reserva de estoque para pedidos pendentes — nova migration SQL**
Alterar o trigger `decrease_stock_on_payment_confirmed` para **também decrementar estoque quando o pedido é criado** (INSERT com qualquer status), não apenas quando aprovado. A lógica de restauração já existe para `refunded`/`rejected`, então:

- INSERT (qualquer status) → decrementa estoque imediatamente
- UPDATE para `approved` → nenhuma ação adicional (já foi decrementado)
- UPDATE para `refunded`/`rejected` → restaura estoque (já funciona)

Isso garante que pedidos PIX/boleto pendentes reservam o estoque.

Ajuste necessário na lógica do trigger:
- No INSERT: decrementar estoque (para qualquer `payment_status`)
- No UPDATE para `approved`: NÃO decrementar de novo (já foi feito no INSERT)
- No UPDATE para `refunded`/`rejected` a partir de qualquer status: restaurar estoque

**C. Expirar pedidos pendentes antigos — nova edge function `expire-pending-orders`**
Pedidos PIX/boleto que nunca foram pagos precisam ter o estoque devolvido. Criar uma função que:
- Busca pedidos com `payment_status = 'pending'` criados há mais de 48h
- Atualiza `payment_status` para `rejected` (o trigger existente restaura o estoque)
- Pode ser chamada manualmente pelo admin ou via cron

**D. Considerar pedidos pendentes no frontend (opcional)**
Adicionar uma função SQL `get_available_stock(variant_id)` que calcula: `stock` da variante menos a soma de quantidades em `order_items` de pedidos com `payment_status = 'pending'`. O frontend usaria essa função em vez do `stock` direto. Porém, com a solução B, isso não é necessário pois o stock já será decrementado no momento do pedido.

### Arquivos alterados

1. **`supabase/functions/create-pagarme-checkout/index.ts`** — Adicionar validação de estoque após validação de preços
2. **Migration SQL** — Reescrever trigger `decrease_stock_on_payment_confirmed` para decrementar no INSERT (qualquer status) e não duplicar no UPDATE para approved
3. **`supabase/functions/expire-pending-orders/index.ts`** — Nova função para expirar pedidos pendentes antigos
4. **`supabase/config.toml`** — Registrar nova edge function (se necessário)

### Resumo da mudança no trigger

```text
ANTES:
  INSERT (approved)  → decrementa
  INSERT (pending)   → nada          ← BUG: oversell
  UPDATE → approved  → decrementa
  UPDATE → refunded  → restaura

DEPOIS:
  INSERT (qualquer)  → decrementa    ← CORRIGIDO
  UPDATE → approved  → nada (já decrementou)
  UPDATE → refunded/rejected → restaura
```

