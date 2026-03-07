

## Plano: Vincular imagens a cores e auto-navegar na galeria

### Resumo
Adicionar um campo `color_id` opcional na tabela `product_images` para vincular imagens a cores específicas. No admin, permitir selecionar a cor de cada imagem. No frontend, quando o usuário selecionar uma cor, a galeria navega automaticamente para a primeira imagem daquela cor.

### 1. Migração de banco de dados
Adicionar coluna `color_id` (uuid, nullable, FK para `colors.id`) na tabela `product_images`:
```sql
ALTER TABLE public.product_images 
ADD COLUMN color_id uuid REFERENCES public.colors(id) ON DELETE SET NULL;
```

### 2. Admin — ProductForm (`src/pages/admin/ProductForm.tsx`)
- Atualizar a interface `ProductImage` para incluir `color_id?: string | null`
- Na seção de imagens, adicionar um `Select` em cada imagem para escolher a cor associada (ou "Todas as cores" como padrão)
- Ao buscar imagens existentes (`fetchProduct`), incluir o `color_id`
- Ao salvar, persistir o `color_id` junto com cada imagem

### 3. Frontend — ProductPage (`src/pages/ProductPage.tsx`)
- Incluir `color_id` no select de `product_images`
- Quando `selectedColor` mudar, encontrar o index da primeira imagem que tem `color_id` correspondente àquela cor e passar para a galeria

### 4. Frontend — ProductGallery (`src/components/product/ProductGallery.tsx`)
- Adicionar prop `initialIndex?: number` que, quando mudar, atualiza o `selectedIndex`
- Um `useEffect` que observa `initialIndex` e navega para ele

### Fluxo do usuário
1. Admin faz upload de fotos e associa cada uma a uma cor (ou deixa sem cor = aparece para todas)
2. Cliente no PDP seleciona uma cor → galeria pula para a primeira foto daquela cor
3. Fotos sem cor vinculada continuam aparecendo normalmente para todas as cores

