

## Problema Identificado

O hook `useEarlyAccess` tem dois problemas criticos:

1. **`ProductsPage` nao usa o `earlyAccessValid`**: A pagina `/produtos` importa o hook e guarda o valor em `earlyAccessValid`, mas na hora de montar o `ProductCard` passa `isComingSoon: product.is_coming_soon ?? false` sem considerar o early access. O override nunca chega ao card.

2. **`sessionStorage` se perde com reload**: Se a cliente compartilha o link `/?ea=VITZ2026` e depois navega para `/produtos`, o parametro `?ea=` some da URL. O `sessionStorage` deveria manter, mas pode falhar em cenarios de reload ou abas novas. Trocar para `localStorage` garante persistencia entre abas e reloads.

3. **Flickering durante loading da query**: Enquanto a validacao do codigo no banco carrega, `isEarlyAccess` e `undefined`, e `undefined || false` retorna `false` -- mostrando blur por um instante.

---

## Plano de Correcao

### 1. Tornar o hook mais robusto (`src/hooks/useEarlyAccess.ts`)

- Trocar `sessionStorage` por `localStorage` para persistir entre abas e reloads
- Adicionar `placeholderData: false` para evitar flickering, mas tambem cachear o resultado com chave fixa para que, uma vez validado, nao pisque novamente
- Simplificar a logica de inicializacao

### 2. Corrigir `ProductsPage` (`src/pages/ProductsPage.tsx`)

- Na montagem do `ProductCard`, usar o valor de `earlyAccessValid` para sobrescrever `isComingSoon`:
  ```
  isComingSoon: earlyAccessValid ? false : (product.is_coming_soon ?? false)
  ```

### 3. Confirmar `ProductCard` (`src/components/product/ProductCard.tsx`)

- O card nao precisa do hook -- ele recebe `isComingSoon` ja resolvido via prop. Nenhuma alteracao necessaria aqui.

### 4. Confirmar `ProductPage` (detalhe) e `NewArrivalsPage`

- Ja usam o hook corretamente. Nenhuma alteracao necessaria.

---

## Resumo dos Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useEarlyAccess.ts` | Trocar sessionStorage por localStorage; melhorar inicializacao |
| `src/pages/ProductsPage.tsx` | Usar `earlyAccessValid` no `isComingSoon` do ProductCard |

Duas alteracoes simples que resolvem o problema de forma definitiva.

