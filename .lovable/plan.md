

# Controle de Custos - Painel Administrativo Vitz

## Resumo

Criar um modulo completo de Controle de Custos no painel admin, replicando a logica da planilha atual com duas visoes: "Controle de Custos" (cadastro e gestao) e "Investimento Realizado" (custos pagos com rateio entre socios).

## O que sera criado

### 1. Tabela no banco de dados: `costs`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| description | text | Descricao do custo |
| category | text | "Fixo Mensal", "Fixo Anual" ou "Variavel" |
| amount | numeric | Valor |
| due_date | date | Data de vencimento |
| paid_date | date (nullable) | Data de pagamento |
| payment_method | text (nullable) | Forma de pagamento |
| cash_withdrawn | numeric (default 0) | Quanto foi retirado do caixa |
| created_at | timestamptz | Criacao |
| updated_at | timestamptz | Atualizacao |

- RLS: somente admins podem ler/escrever
- Todos os ~60 custos da planilha serao importados via migration SQL

### 2. Pagina Admin: `/admin/custos`

Pagina com duas abas (Tabs):

**Aba 1 - Controle de Custos:**
- Tabela com todas as colunas: Descricao, Categoria, Valor, Vencimento, Pagamento, Forma de Pagamento
- Botao "Novo Custo" abre dialog/formulario
- Edicao inline ou via dialog para preencher data de pagamento e forma
- Indicador visual: custos vencidos em vermelho, pagos em verde
- Filtros por categoria e status (pago/pendente)
- Totalizadores: total geral, total pago, total pendente

**Aba 2 - Investimento Realizado:**
- Lista automaticamente apenas custos com `paid_date` preenchida
- Colunas: Descricao, Valor, Retirado do Caixa, e a diferenca dividida por 5 socios (Nelinho, Nat, Nick, Nady, Gui)
- Campo editavel "Retirado do Caixa" para cada custo
- Calculo automatico: (Valor - Retirado do Caixa) / 5 = valor por socio
- Totalizadores por socio no rodape

### 3. Navegacao

- Novo item "Custos" no sidebar admin (icone DollarSign), no grupo "Outros"
- Rota `/admin/custos` no App.tsx

## Secao Tecnica

### Arquivos a criar:
- `src/pages/admin/AdminCosts.tsx` - pagina principal com as duas abas

### Arquivos a modificar:
- Migration SQL: criar tabela `costs` + inserir dados historicos + RLS policies
- `src/components/admin/AdminSidebar.tsx` - adicionar link "Custos"
- `src/App.tsx` - adicionar rota `/admin/custos`
- `src/pages/admin/index.ts` - exportar AdminCosts

### Dados importados (60+ registros):
Todos os custos da planilha serao inseridos na migration, incluindo os que ja foram pagos (com paid_date preenchida) e os pendentes (sem paid_date).

### Logica do rateio entre socios:
- Quando um custo e pago, ele aparece na aba "Investimento Realizado"
- O admin pode informar quanto foi retirado do caixa da empresa
- A diferenca (Valor - Caixa) e dividida igualmente entre os 5 socios
- Os nomes dos socios sao fixos: Nelinho, Nat, Nick, Nady, Gui

