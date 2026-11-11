# Xevek — consulta de pedidos Vitz

## Endereço e autorização

A função `xevek-orders` está publicada no Lovable Cloud. Copie sua URL completa em **Backend → Functions → xevek-orders** e use essa URL como `XEVEK_ORDERS_URL` nos exemplos abaixo. A URL da loja (`usevitz.com`) não é o endereço desta API.

A chave `XEVEK_API_KEY` foi cadastrada com segurança. Configure o mesmo valor no Xevek no cabeçalho `x-api-key`. O valor não aparece neste documento e não deve ser inserido no código da loja.

A função não depende do login do cliente. Faz apenas consultas SELECT em `orders` e `order_items`; não cria, altera nem apaga registros.

## Exemplos de curl

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

- 23 testes passaram, incluindo os testes existentes do GymRats e nove testes da integração Xevek.
- Função publicada: autorização ausente bloqueada com 401, entrada inválida com 400 e pedido inexistente com 404.
- Consulta real por número/e-mail e por telefone retornou 200; contato incorreto para pedido existente retornou o mesmo 404 de pedido inexistente.
- Requisição com `Origin` foi bloqueada.
- Nenhum pedido ou cadastro foi alterado durante os testes.