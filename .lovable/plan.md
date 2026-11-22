# Black Week Vitz

## Promoção e cupons
- **Compre 1 conjunto, leve 2: o de menor valor sai grátis.** Somente conjuntos participam; a quantidade considera também duas unidades do mesmo conjunto.
- A cada par, conceder uma unidade grátis. Para vários conjuntos, ordenar os preços do maior para o menor e formar pares consecutivos, tornando grátis o menor de cada par; peças avulsas e acessórios ficam fora.
- **Não acumula com nenhum cupom**, inclusive o das inscritas do GymRats.
- Com dois ou mais conjuntos elegíveis, ao aplicar um **cupom válido**, abrir um popup antes de alterar o total: **“Ao aplicar um cupom, você perde a promoção da Black Week. Os descontos não são acumulativos.”**
- Oferecer **“Manter promoção”** e **“Usar cupom”**. Fechar o aviso sem confirmar mantém a promoção. Confirmar substitui o desconto Black pelo desconto do cupom, com total atualizado.
- Remover o cupom restaura automaticamente a promoção se ainda estiver vigente. Se um cupom já estiver aplicado quando o carrinho atingir dois conjuntos, solicitar a mesma escolha antes de finalizar; nunca somar os descontos.
- Manter as regras atuais de validade, limite de uso e valor mínimo dos cupons. Cupom inválido não cancela a promoção.

## Datas e acesso
- Usar sempre o horário de Brasília.
- **26/11/2026, 00:00–23:59:** antecipação apenas pelo link `https://usevitz.com/?acesso=grupo`, mantendo a liberação no navegador nas próximas visitas desse mesmo dia.
- Sem esse acesso no dia 26: visual normal, faixa discreta **“Black Week Vitz começa 27/11”** e contagem regressiva.
- **27/11/2026, 00:00 até 30/11/2026, 23:59:** promoção e visual liberados para todos.
- Ao virar 01/12, desligar promoção e tema automaticamente, restaurando o visual atual.
- Pré-visualizações `?preview=blackweek` e `?preview=grupo` para conferir o tema; não autorizam descontos em pagamentos reais fora das datas.

## Visual
- Preservar a identidade e as fontes atuais, com fundo `#0E0C0B`, textos `#F6F0E4` e destaques `#C29F74`, exclusivamente durante a campanha.
- Faixa fixa com contagem regressiva e os textos do documento para acesso antecipado e período público; em 30/11, **“ÚLTIMAS HORAS · acaba hoje às 23h59”**.
- Home com título **“Black Week”**, Week em itálico caramelo, oferta e botão **“Montar meu par”** para a coleção de conjuntos; foto de duas modelos ou dois conjuntos lado a lado.
- Selo **“1+1”** nos cards de conjuntos participantes.
- Seção **“Faz a conta”**: Essential R$ 225 + Daily R$ 187, R$ 412 riscado e **“você paga R$ 225 · R$ 187 de presente”**.
- Exibir **“até 3x sem juros”**, preservando o fluxo de pagamento; durante a campanha, garantir essa condição também no cálculo final.

## Carrinho e pagamento
- Mostrar o desconto **“Black Week: −R$ X”** e o total correto no carrinho lateral, `/carrinho` e checkout.
- Com um conjunto, mostrar **“Adicione mais 1 conjunto e o de menor valor sai grátis”**.
- Aplicar o aviso de cupom tanto no carrinho quanto no checkout, incluindo cupons recebidos pelo link do carrinho.
- Recalcular preços, elegibilidade, datas e exclusão mútua entre cupom e Black no serviço que cria o pagamento: o valor cobrado deve corresponder ao resumo, sem confiar no desconto enviado pelo navegador.
- Preservar frete, estoque, demais brindes e cartão-presente; cartão-presente continua sendo saldo de pagamento, não cupom promocional.

## Verificação
- Testar datas-limite, antecipação persistente e desligamento automático.
- Testar um, dois, três e quatro conjuntos, quantidades repetidas e carrinhos com acessórios.
- Testar cupom válido e inválido, as duas escolhas do popup, remoção do cupom e mudança de quantidade.
- Conferir home, cards, carrinho e popup no celular e computador.
- Validar um pedido de teste e conferir o valor registrado e o valor enviado à Pagar.me, sem cobrança real nem envio de comunicações à cliente. Se não houver ambiente seguro para concluir o teste, informar a limitação em vez de criar uma cobrança real.

## Detalhes técnicos
- Centralizar calendário, elegibilidade e cálculo em um módulo compartilhado pelo site e pela função de pagamento, com testes de regras.
- Isolar o tema temporário em tokens e uma condição de campanha para restaurar o estilo normal sem reescrever a identidade global.
- Persistir acesso antecipado limitado à data e validar essa autorização no pagamento; não usar parâmetros de pré-visualização como autorização.
- Reutilizar o popup de confirmação e os botões existentes; manter cupom e escolha de desconto consistentes entre carrinho e checkout.
