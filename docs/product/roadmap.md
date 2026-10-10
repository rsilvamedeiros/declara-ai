# Roadmap

Status: rascunho

A visão do produto é ampla (área pública, cofre, extração, validação, simulação, roteiro, educação, multiusuário). O roadmap separa a visão em fases e define o **menor recorte que prova a visão ponta a ponta** como MVP.

## Critério de sucesso do MVP

Um usuário real, com documentos reais de um ano-calendário, chega a um roteiro de preenchimento ficha a ficha, com valores rastreáveis, validações e a comparação completo x simplificado, sem digitar tudo do zero. O mesmo fluxo deve funcionar também por entrada manual.

## Fases

### Fase 0: Fundação (documentação e decisões)
Produto, domínio fiscal, requisitos, arquitetura e processo de engenharia (SDD e TDD).

### Fase 1: MVP
- Modelo de dados fiscal com rastreabilidade (pessoa, ano, documento, campo extraído com origem).
- Catálogo de regras do ano-calendário, versionado, com fonte oficial e testes.
- Conta de usuário, cadastro do titular e isolamento entre usuários.
- Ingestão e extração de dois tipos de documento: informe de rendimentos do empregador e recibos de despesas médicas, com revisão humana obrigatória.
- Entrada manual dos mesmos dados.
- Validadores determinísticos (CPF/CNPJ, limites de dedução, recibo incompleto, consistência de somas).
- Simulador completo x simplificado.
- Roteiro ficha a ficha para as fichas cobertas.
- Área pública mínima: conteúdo educativo e simulador básico.

Por quê: cobre o fluxo ponta a ponta com os tipos de documento mais estruturados e comuns, e prova a rastreabilidade e a separação entre IA e regra determinística.

### Fase 2: Núcleo familiar e histórico
- Cônjuge e dependentes (declaração conjunta e regras de dedução).
- Vários anos e divergência de saldos entre anos.
- Importação da declaração do ano anterior.
- Mais tipos de documento: informes de bancos, educação.

### Fase 3: Investimentos
- Notas de corretagem, renda variável, DARFs, compensação de prejuízos.
- Carnê-leão e alertas de rendimentos que exigiam recolhimento mensal.

### Fase 4: Inteligência contínua
- Monitoramento de mudanças de normas, com revisão humana e análise de impacto.
- Projeção do imposto do ano em curso.
- Pacote organizado de comprovantes completo.

### Fase 5: Escala de produto
- Planos e cobrança, suporte, perfil de contador/terceiro (se confirmado), conteúdo educativo ampliado.

## Princípio de corte

Entra primeiro o que (1) prova o fluxo ponta a ponta, (2) tem regra estável e documento estruturado, (3) pode ser verificado deterministicamente. Domínios com muitas exceções (renda variável, compensação de prejuízos) ganham ciclo próprio.

## Perguntas abertas

- TODO(pergunta): a ordem das fases 2 e 3 deve ser definida pelo perfil dos primeiros usuários?
