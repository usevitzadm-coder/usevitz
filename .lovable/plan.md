

## Plano: Controle inteligente de autoplay na galeria de produto

### Problema
O autoplay do carrossel roda continuamente. O usuário quer que ele pare permanentemente quando:
1. Clicar em uma miniatura/dot específico
2. Selecionar uma cor que tenha foto vinculada

Após parado, o autoplay só retoma se o usuário usar as setas de navegação ou trocar a cor. Cada produto mantém seu estado independente.

### Mudanças

**`src/components/product/ProductGallery.tsx`**
- Renomear `isPaused` para algo como `isAutoplayStopped` com semântica de "parada permanente"
- Adicionar nova prop `autoPlayStopped?: boolean` para o parent (ProductPage) poder sinalizar que a cor foi selecionada
- Nos cliques de thumbnail (desktop, mobile) e dots: setar `isAutoplayStopped = true`
- Nos cliques das setas (prev/next): **não** parar o autoplay (manter comportamento normal)
- Quando `activeIndex` muda via prop (seleção de cor): parar autoplay via `setIsAutoplayStopped(true)`
- Remover o hover pause (`onMouseEnter`/`onMouseLeave`) ou mantê-lo como comportamento separado — a parada permanente tem prioridade
- O autoplay só reinicia se o usuário usar as setas ou trocar de cor. Na troca de cor, resetar `isAutoplayStopped = false` para permitir que as setas reativem

Lógica resumida:
- Thumbnail/dot click → para autoplay permanentemente
- Seleção de cor com foto → para autoplay permanentemente  
- Setas → não afetam o estado de parada, funcionam como navegação manual
- Troca de cor → para autoplay (já que `activeIndex` muda)

**`src/pages/ProductPage.tsx`**
- Passar prop `autoPlayStopped` ao `ProductGallery` quando cor com imagem é selecionada (já seta `galleryIndex`, basta a gallery reagir internamente)

Na prática, a maior parte da lógica fica dentro do `ProductGallery` — basta ele detectar que `activeIndex` mudou para parar o autoplay, e detectar cliques em thumbnails/dots para parar também.

