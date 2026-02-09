
# Estrategia de Lancamento: Produtos "Coming Soon"

## Resumo
Adicionar um campo `is_coming_soon` na tabela de produtos para marcar itens como "em breve". Esses produtos aparecem no catalogo com imagens desfocadas, sem opcao de compra, e com um formulario de captura de e-mail para acesso antecipado. Uma nova tabela `launch_leads` armazena os e-mails capturados.

## O que muda para voce (Admin)
- No formulario de produto, um novo toggle **"Produto em lancamento"** ao lado do toggle "Ativo"
- Os produtos marcados aparecem normalmente na listagem do admin com um badge "Em breve"
- Na aba de configuracoes ou em uma nova secao, voce pode ver os leads capturados por produto

## O que o cliente ve
- **Catalogo (/produtos)**: O card do produto aparece com a imagem desfocada (blur), um badge "Em Breve" e sem preco visivel
- **Pagina do produto (/produto/slug)**: Todas as imagens da galeria ficam com desfoque. Os seletores de cor, tamanho e quantidade ficam ocultos. No lugar do botao "Adicionar ao Carrinho", aparece um formulario com campo de e-mail e o texto: *"Inscreva-se aqui para ficar por dentro do lancamento e ter acesso antecipado"*
- Ao se inscrever, o cliente recebe uma confirmacao visual (toast)

---

## Detalhes Tecnicos

### 1. Migracao de Banco de Dados

**Tabela `products`** - novo campo:
```sql
ALTER TABLE products ADD COLUMN is_coming_soon boolean NOT NULL DEFAULT false;
```

**Nova tabela `launch_leads`**:
```sql
CREATE TABLE launch_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, email)
);

ALTER TABLE launch_leads ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode se inscrever
CREATE POLICY "Anyone can subscribe to launches"
  ON launch_leads FOR INSERT WITH CHECK (true);

-- Admins podem ver todos os leads
CREATE POLICY "Admins can manage launch leads"
  ON launch_leads FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Arquivos Modificados

**`src/types/product.ts`**
- Adicionar `isComingSoon?: boolean` na interface `Product`

**`src/components/product/ProductCard.tsx`**
- Se `product.isComingSoon`, aplicar `blur-sm` na imagem
- Exibir badge "Em Breve" no lugar do badge normal
- Ocultar preco e descricao curta
- Manter o link funcional (leva para a PDP)

**`src/pages/ProductPage.tsx`**
- Se `is_coming_soon`, aplicar `blur-md` em todas as imagens da galeria
- Ocultar seletores de cor, tamanho e quantidade
- Substituir o botao "Adicionar ao Carrinho" por um formulario de captura de lead (campo e-mail + botao "Quero saber primeiro")
- Ao enviar, inserir na tabela `launch_leads` e exibir toast de confirmacao

**`src/pages/ProductsPage.tsx`**
- Incluir `is_coming_soon` no select da query

**`src/pages/admin/ProductForm.tsx`**
- Adicionar toggle "Produto em lancamento" na secao de configuracoes (ao lado de "Ativo")
- Salvar/carregar o campo `is_coming_soon`

**`src/pages/admin/AdminProducts.tsx`**
- Exibir badge "Em breve" na listagem quando o produto estiver marcado

### 3. Componente de Captura de Lead (inline na PDP)
- Campo de e-mail com validacao basica
- Botao com texto "Quero saber primeiro"
- Mensagem contextual: "Inscreva-se para ficar por dentro do lancamento e ter acesso antecipado"
- Prevencao de duplicatas via constraint UNIQUE no banco (com tratamento de erro amigavel)
