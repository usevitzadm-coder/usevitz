

## Seção "Complete seu look" na PDP — Peças Similares

### Situação atual
A PDP já tem uma seção "Você também pode gostar" que busca produtos da **mesma categoria**. A ideia é melhorar essa seção existente, transformando-a em um carrossel mais compacto e engajante no estilo do `CartSuggestions`, ou adicionar uma nova seção complementar.

### Plano

**Melhorar a seção "Você também pode gostar" existente** (linhas 550-582 do `ProductPage.tsx`), transformando-a em um carrossel horizontal com auto-rotação e visual mais atrativo, similar ao que fizemos no carrinho.

#### Alterações:

1. **`src/components/product/SimilarProducts.tsx`** (novo)
   - Componente reutilizável que recebe `categoryId` e `currentProductId` como props
   - Busca produtos da mesma categoria (excluindo o atual), limitado a 8
   - Renderiza em carrossel horizontal usando Embla Carousel (já disponível no projeto)
   - Cards compactos com imagem, nome, preço, badge — reutilizando `ProductCard` existente
   - Título chamativo: "Complete seu look" ou "Peças que combinam"
   - Setas de navegação + dots indicadores
   - Auto-play com pausa ao interagir

2. **`src/pages/ProductPage.tsx`** (edição)
   - Substituir a seção estática "Você também pode gostar" (grid 4 colunas) pelo novo componente `<SimilarProducts categoryId={product.category_id} currentProductId={product.id} />`
   - Remover a query `relatedProducts` do ProductPage (movida para o componente)

#### Visual
- Desktop: carrossel mostrando 4 cards lado a lado com setas
- Mobile: carrossel mostrando 1.5 cards com scroll snap
- Background `bg-vitz-cream-dark` mantido
- Título "✨ Complete seu look" com estilo heading

