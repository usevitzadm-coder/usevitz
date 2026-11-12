# Xevek — consulta de pedidos Vitz

## Endereço e autorização

A função `xevek-orders` está publicada no Lovable Cloud. Copie sua URL completa em **Backend → Functions → xevek-orders** e use essa URL como `XEVEK_ORDERS_URL` nos exemplos abaixo. A URL da loja (`usevitz.com`) não é o endereço desta API.

A chave `XEVEK_API_KEY` foi cadastrada com segurança. Configure o mesmo valor no Xevek no cabeçalho `x-api-key`. O valor não aparece neste documento e não deve ser inserido no código da loja.

A função não depende do login do cliente. As rotas de pedidos fazem apenas SELECT em `orders` e `order_items`; nunca alteram pedidos. As rotas de consentimento acessam exclusivamente `marketing_consents`, e somente a retirada de aceite altera essa tabela.

## Exemplos de curl

## Consentimento de WhatsApp

`marketing_consents` é a fonte única e privada: `phone` (E.164 único), `name`, `email`, `whatsapp_opt_in`, `opted_in_at`, `opted_out_at`, `updated_at`, `source`, `consent_text`. Só funções com acesso de serviço leem/escrevem; não há acesso público nem leitura direta pela conta da cliente.

Origens: `gymrats`, `cadastro`, `checkout`, `newsletter`, `minha_conta`, `whatsapp`. Os aceites existentes do GymRats foram importados com a data de inscrição e o texto antigo exato. Novas caixas começam desmarcadas. Não marcar uma caixa de inscrição não concede nem cancela um aceite anterior; a retirada explícita acontece em Minha conta ou via Xevek.

### Consultar um telefone

```bash
curl --request POST "${XEVEK_ORDERS_URL}/customers/consent" \
  --header "Content-Type: application/json" \
  --header "x-api-key: ${XEVEK_API_KEY}" \
  --data '{"phone":"+5511999998888"}'
```

Resposta 200: `{"phone":"+5511999998888","name":"Exemplo","whatsapp_opt_in":true,"opted_in_at":"2026-11-12T00:00:00Z","opted_out_at":null,"source":"gymrats"}`. Não encontrado: 404 `{"error":"customer_not_found"}`. Nome e datas podem ser `null`.

### Sincronizar alterações (inclui retiradas)

```bash
curl --request POST "${XEVEK_ORDERS_URL}/customers/opted-in" \
  --header "Content-Type: application/json" \
  --header "x-api-key: ${XEVEK_API_KEY}" \
  --data '{"since":"2026-11-01T00:00:00Z","limit":500}'
```

Resposta 200: `{"customers":[...],"next_cursor":"..."}`. Apesar do nome da rota, inclui TODOS os consentimentos alterados, inclusive `whatsapp_opt_in:false`. `since` é opcional e filtra `updated_at > since`; omitir retorna todos. `limit` é inteiro de 1 a 500, padrão 500. Ordenação crescente por `updated_at`, com telefone como desempate. Para a próxima página, envie o `next_cursor` opaco como `cursor`, mantendo o mesmo `since`; `null` encerra. Guarde o instante de início da sincronização como próximo `since`, para não perder mudanças concorrentes. O cursor preserva a precisão da data, não deve ser decodificado/alterado pelo integrador.

### Retirar aceite

```bash
curl --request POST "${XEVEK_ORDERS_URL}/customers/opt-out" \
  --header "Content-Type: application/json" \
  --header "x-api-key: ${XEVEK_API_KEY}" \
  --data '{"phone":"+5511999998888"}'
```

Sempre 200 `{"ok":true}` para telefone válido. Atualiza apenas `whatsapp_opt_in=false`, `opted_out_at=agora`, `source=whatsapp`; `updated_at` é atualizado automaticamente. Preserva nome, e-mail, data/texto do aceite anterior. Se não existir, cria um registro já retirado.

Os telefones ficam em E.164 com os dígitos reais; números brasileiros locais recebem +55. A comparação aceita a mesma equivalência brasileira do nono dígito usada em pedidos, sem remover esse dígito do número armazenado. Telefones internacionais exigem +DDI. As respostas de consentimento contêm somente os seis campos mostrados, nunca e-mail, CPF, endereço ou dados de pagamento. Autenticação por `x-api-key`, rejeição de `Origin`, limite de corpo e erros 400/401/500 são iguais às rotas de pedidos.

## Exemplos de consulta de pedidos

Os exemplos pressupõem `XEVEK_ORDERS_URL` e `XEVEK_API_KEY` configurados no ambiente do servidor que executa a integração. Não use saída detalhada (`curl -v`) porque ela pode revelar a chave.

### Dez pedidos mais recentes por telefone

```bash
curl --request POST "${XEVEK_ORDERS_URL}/orders/by-phone" \
  --header "Content-Type: application/json" \
  --header "x-api-key: ${XEVEK_API_KEY}" \
  --data '{"phone":"+5511999998888"}'
```

### Um pedido por número e telefone

```bash
curl --request POST "${XEVEK_ORDERS_URL}/orders/by-number" \
  --header "Content-Type: application/json" \
  --header "x-api-key: ${XEVEK_API_KEY}" \
  --data '{"order_number":"VITZ-EXEMPLO","phone":"+5511999998888"}'
```

### Um pedido por número e e-mail

```bash
curl --request POST "${XEVEK_ORDERS_URL}/orders/by-number" \
  --header "Content-Type: application/json" \
  --header "x-api-key: ${XEVEK_API_KEY}" \
  --data '{"order_number":"VITZ-EXEMPLO","email":"cliente@example.com"}'
```

Use o número completo salvo pela Vitz, incluindo o prefixo `VITZ-` quando houver. Os números e contatos acima são exemplos fictícios.

## Regras e erros

- Somente POST com JSON. Outros métodos, JSON inválido e dados inválidos: `400 {"error":"invalid_request"}`.
- Sem chave ou chave incorreta: `401 {"error":"unauthorized"}`.
- Telefone sem pedidos: `404 {"error":"customer_not_found"}`.
- Pedido inexistente ou contato que não confere: exatamente `404 {"error":"order_not_found"}`.
- Falha interna de consulta: `500 {"error":"internal_error"}`, sem detalhes pessoais ou internos.
- Telefone brasileiro: comparação por dígitos, com ou sem `55`, formatação livre e com ou sem o nono dígito `9` depois do DDD. O DDD precisa conferir. Números incompletos são recusados.
- E-mail: comparação sem diferenciar maiúsculas e minúsculas, removendo espaços externos.
- Por telefone: até dez pedidos em ordem decrescente de criação. Os dados de `customer` vêm do pedido mais recente encontrado; cada pedido mantém seus próprios itens e entrega.
- Por número: exige telefone ou e-mail correspondente. Quando ambos forem fornecidos e válidos, basta um conferir, conforme a regra solicitada.
- Não retorna CPF, endereço completo, CEP, bairro, dados de cartão, identificadores internos ou dados de outros clientes.
- Datas são retornadas em ISO 8601, normalizadas para UTC; valores monetários são números em reais.
- Respostas usam `Cache-Control: no-store`.

**Diferença em relação ao briefing:** a plataforma exige os cabeçalhos CORS padronizados em funções web. Eles foram mantidos, mas requisições com `Origin` são recusadas, não há aprovação de preflight e a chave continua obrigatória. A integração permanece destinada apenas a chamadas servidor a servidor.

## Origem de cada campo

| Campo da resposta | Tabela e campo / regra |
|---|---|
| `customer.name` | `orders.customer_name`, do pedido mais recente retornado |
| `customer.email` | `orders.customer_email`, do pedido mais recente retornado |
| `orders[].order_number` | `orders.order_number` |
| `orders[].created_at` | `orders.created_at`, ISO 8601 |
| `orders[].status` | `orders.status` e `orders.payment_status`, conforme tabela abaixo |
| `orders[].status_label` | Rótulo correspondente à loja; reembolso usa “Reembolsado” |
| `orders[].total` | `orders.total`, em reais |
| `orders[].shipping_cost` | `orders.shipping_cost`, em reais |
| `orders[].payment_method` | `orders.payment_method`; `null` quando não preenchido |
| `items[].name` | `order_items.product_name` |
| `items[].variant` | `order_items.variant_info`; `null` quando não preenchido |
| `items[].quantity` | `order_items.quantity` |
| `items[].unit_price` | `order_items.unit_price`, em reais |
| `shipping.carrier` | `null`: não há campo independente de transportadora |
| `shipping.method` | `orders.shipping_method`; `null` quando não preenchido |
| `shipping.tracking_code` | `orders.tracking_code`; `null` quando não preenchido |
| `shipping.tracking_url` | `null`: não há URL de rastreio salva |
| `shipping.shipped_at` | `null`: não há data de envio salva |
| `shipping.estimated_delivery` | `null`: não há previsão de entrega salva no pedido |
| `shipping.delivered_at` | `null`: não há data de entrega salva |
| `shipping.city` | `orders.shipping_city` |
| `shipping.state` | `orders.shipping_state` |

Os itens são vinculados pelo campo `order_items.order_id = orders.id`. `orders.id` é usado apenas internamente. Nenhuma data é deduzida de `updated_at`, nem se constrói URL de rastreamento ou transportadora a partir de suposições.

## Mapeamento de status

| Status Vitz (`orders.status`) | Status Xevek | Rótulo |
|---|---|---|
| `pending` | `pending_payment` | Pendente |
| `confirmed` | `paid` | Confirmado |
| `processing` | `processing` | Preparando |
| `shipped` | `shipped` | Enviado |
| `delivered` | `delivered` | Entregue |
| `cancelled` | `canceled` | Cancelado |
| Qualquer status com `payment_status = refunded`, ou status `refunded` | `refunded` | Reembolsado |

Reembolso tem prioridade sobre os demais estados. Não se inventa status para valores desconhecidos: uma ocorrência não mapeada gera erro interno, para evitar informar algo incorreto ao cliente.

## Verificação realizada

- 37 testes passaram, cobrindo GymRats, pedidos e regras de consentimento, incluindo paginação, datas, autenticação, retirada e proteção contra acesso a consentimentos de outra cliente.
- Função publicada: autorização ausente bloqueada com 401, entrada inválida com 400 e pedido inexistente com 404.
- Consulta real por número/e-mail e por telefone retornou 200; contato incorreto para pedido existente retornou o mesmo 404 de pedido inexistente.
- Requisição com `Origin` foi bloqueada.
- As novas rotas foram verificadas com inscrições fictícias: consulta do aceite salvo, retirada com leitura posterior, criação de retirada para telefone desconhecido e paginação real. A preferência em Minha conta foi autorizada, retirada e conferida após recarregar. Os registros fictícios foram removidos; nenhum pedido real foi alterado.