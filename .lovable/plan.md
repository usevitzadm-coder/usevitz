

## Régua de Benefícios no Carrinho Lateral

### O que será criado

Uma barra de progresso com os benefícios desbloqueáveis, exibida no carrinho lateral (CartDrawer) acima da lista de itens quando há produtos. Dois marcos:

1. **R$ 180,00** — Parcele em até 3x sem juros
2. **R$ 239,90** — Frete grátis para o Sudeste

A régua mostra:
- Uma barra de progresso visual indicando quanto falta para o próximo benefício
- Ícones/texto dos benefícios com estado ativo (desbloqueado) ou inativo (falta X reais)
- Mensagem dinâmica: "Faltam R$ XX para frete grátis!" ou "Você desbloqueou todos os benefícios!"

### Arquivos

1. **`src/components/cart/CartBenefitsBar.tsx`** (novo) — Componente da régua com lógica de thresholds e barra de progresso
2. **`src/components/cart/CartDrawer.tsx`** — Importar e renderizar o `CartBenefitsBar` entre o header e a lista de itens, passando `cartTotal`

### Detalhes técnicos

- Thresholds fixos: `INSTALLMENT_THRESHOLD = 180` e `FREE_SHIPPING_THRESHOLD = 239.90` (consistente com os valores já usados no checkout e no cálculo de frete)
- Barra de progresso com `max = FREE_SHIPPING_THRESHOLD` (o maior valor)
- Dois marcadores na barra nas posições proporcionais (180/239.90 ≈ 75% e 100%)
- Cores: benefício desbloqueado em verde/primary, pendente em muted
- Ícones: `CreditCard` para parcelamento, `Truck` para frete grátis (lucide-react)

