

## "Leve também" — Carrossel de Acessórios no Carrinho Lateral

### O que será criado

Uma seção "Leve também" no `CartDrawer`, exibida abaixo da lista de itens do carrinho (e acima do footer), com os produtos da categoria **Acessórios** em formato de carrossel horizontal. Cada card mostra imagem, nome e preço, com botão para adicionar ao carrinho diretamente.

### Dados

A categoria "Acessórios" já existe no banco (`id: 1bb234a0-...`) com 3 produtos ativos: Boné Vitz (R$49,90), Headband (R$24,90) e Ecobag (R$39,90). A query buscará produtos + primeira imagem + primeira variante ativa dessa categoria.

### Arquivos

1. **`src/components/cart/CartSuggestions.tsx`** (novo)
   - Componente que busca acessórios do banco via Supabase (products + product_images + product_variants, filtrados por `category_id` de Acessórios)
   - Exclui produtos que já estão no carrinho
   - Renderiza carrossel horizontal com scroll nativo (CSS `overflow-x-auto`, snap scroll)
   - Cada card: imagem (80x80), nome, preço e botão "+" para adicionar ao carrinho (usa `addToCart` do contexto, adicionando a primeira variante com estoque)
   - Se não houver sugestões (todos já no carrinho ou sem dados), retorna null

2. **`src/components/cart/CartDrawer.tsx`** (edição)
   - Importar e renderizar `<CartSuggestions />` dentro da área scrollável, logo após a `<ul>` de itens

### Detalhes técnicos

- Query: `supabase.from('products').select('id, name, slug, price, product_images(url), product_variants(id, size, color, color_hex, stock, sku)').eq('category_id', ACESSORIOS_CATEGORY_ID).eq('is_active', true).eq('product_variants.is_active', true)`
- Carrossel usa scroll nativo com `snap-x` do Tailwind (leve, sem dependência extra)
- Ao clicar "+", chama `addToCart` com o produto formatado e a primeira variante disponível, sem precisar selecionar tamanho/cor (acessórios geralmente têm "Tam. Único")
- Filtra itens já presentes no carrinho pelo `product.id`

