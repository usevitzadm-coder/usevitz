

## Plano: Adicionar opção "Retirada Combinada" para CEP 05524-000

### Resumo
Adicionar uma opção de frete gratuita chamada "Retirada Combinada" que aparece exclusivamente quando o CEP de destino é `05524000`. A lógica será implementada no frontend (CartPage e CheckoutPage), após o retorno das opções do Melhor Envio.

### Alterações

**1. `src/pages/CartPage.tsx`** — Na função `calculateShipping`, após montar as opções de frete e antes de setar no state, adicionar a lógica:

```typescript
const PICKUP_CEP = "05524000";
if (cleanCep === PICKUP_CEP) {
  const pickupOption: ShippingOption = {
    id: 999,
    name: "Retirada Combinada",
    price: 0,
    delivery_time: 0,
    company: { name: "Vitz", picture: "" },
  };
  options = [pickupOption, ...options];
}
```

**2. `src/pages/CheckoutPage.tsx`** — Na função `calculateShipping`, mesma lógica após montar as opções:

```typescript
const PICKUP_CEP = "05524000";
if (cep.replace(/\D/g, "") === PICKUP_CEP) {
  const pickupOption: ShippingOption = {
    id: 999,
    name: "Retirada Combinada",
    price: 0,
    delivery_time: 0,
    company: { name: "Vitz", picture: "" },
  };
  options = [pickupOption, ...options];
}
```

**3. Exibição do prazo** — Onde o prazo de entrega é exibido, tratar `delivery_time === 0` para mostrar "A combinar" em vez de "0 dias úteis".

### Comportamento
- CEP `05524-000`: aparece "Retirada Combinada (Grátis)" como primeira opção, junto com as demais opções de frete
- Qualquer outro CEP: comportamento atual sem alterações
- A opção usa `id: 999` para não conflitar com os IDs do Melhor Envio

