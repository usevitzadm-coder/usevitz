
# Early Access para Clientes Fieis

## Conceito
Criar um sistema de "early access" via link secreto (ex: `?ea=CODIGO_SECRETO`) que permite que clientes selecionados visualizem e comprem produtos marcados como "Em Breve" normalmente, sem blur, sem precos escondidos e com o botao de carrinho funcionando.

## Como vai funcionar
1. Voce compartilha um link como `usevitz.lovable.app/produto/nome-do-produto?ea=VITZ2026` com clientes fieis
2. Ao acessar com esse parametro, o produto aparece como se ja estivesse lancado: imagens sem blur, preco visivel, selecao de cor/tamanho e botao de adicionar ao carrinho
3. O codigo de early access sera configuravel pelo admin na pagina de configuracoes

## Alteracoes Tecnicas

### 1. Pagina do Produto (`ProductPage.tsx`)
- Ler o parametro `ea` da URL via `useSearchParams`
- Buscar o codigo de early access valido da tabela `store_settings` (chave `early_access_code`)
- Se o codigo bater, forcar `isComingSoon = false`, permitindo compra normal

### 2. Card do Produto (`ProductCard.tsx`)
- Propagar o parametro `?ea=...` nos links dos cards de produto para que ao navegar pela listagem, o early access se mantenha

### 3. Pagina de Listagem (`ProductsPage.tsx`)
- Propagar o parametro `ea` para os ProductCards, removendo blur e mostrando precos

### 4. Configuracao do Admin
- Adicionar uma entrada na tabela `store_settings` com a chave `early_access_code` e o valor do codigo secreto (ex: `VITZ2026`)
- Pode ser adicionado diretamente ou via pagina de configuracoes do admin

### 5. Seguranca
- O codigo e verificado contra o banco de dados (nao hardcoded no frontend)
- Sem o codigo correto, os produtos continuam com a experiencia de lancamento normal
- O admin pode mudar o codigo a qualquer momento para invalidar links antigos
