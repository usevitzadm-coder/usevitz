# Instalar o pixel da Meta e medir a compra

## O que será feito

- Adicionar o pixel `1707492460744293` uma única vez, com `PageView` em todas as páginas e mudanças de rota.
- Disparar `AddToCart` somente quando uma quantidade válida entrar no carrinho, com produto, quantidade e valor em BRL.
- Disparar `InitiateCheckout` ao seguir do carrinho para o checkout, com os itens e o total atual.
- Disparar `Purchase` somente após confirmar no pedido que o pagamento está aprovado, usando o total real e o ID do pedido para evitar duplicação em recarregamentos. Pix e boleto pendentes não contam como compra.
- Aplicar o banner regional de cookies: nas regiões que exigem consentimento, o pixel só carrega após aceite de publicidade. Recusa e Global Privacy Control bloqueiam o envio; o rodapé terá “Configurações de cookies” para alterar a escolha.
- Atualizar a política de privacidade com o compartilhamento com a Meta, as finalidades de medição/otimização e a forma de retirar o consentimento.

## Verificação

- Testar as regras de payload, pagamento aprovado e prevenção de duplicidade.
- Conferir no navegador PageView, AddToCart e InitiateCheckout e suas requisições à Meta após o aceite.
- Não realizar uma cobrança real: o envio de Purchase ficará sem teste de ponta a ponta se não houver um pedido de teste seguro.
- A conexão da Meta não está configurada neste projeto; o recebimento no Gerenciador de Eventos ficará para confirmação na conta.

## Detalhes técnicos

- Criar um módulo browser-only para o Pixel, preservando a fila oficial do `fbq`, usando `{agent:'lovable'}` e IDs estáveis de evento.
- Copiar o módulo de consentimento regional da biblioteca do Lovable, sem criar uma segunda chave de permissão.
- Consultar o pedido autenticado na página de sucesso antes de medir Purchase; nenhum dado de cliente será adicionado aos parâmetros dos eventos.
- Não instalar Conversions API, correspondência avançada nem envio de identificadores, pois não foram solicitados.
