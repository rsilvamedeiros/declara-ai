# ADR-0006: Uso de IA e provedor

- Status: proposta
- Data: 2026-10-10

## Contexto
Decisão do produto: robôs locais em Python validando, mais IA, além de APIs internas. Privacidade é requisito central.

## Opções
1. **IA via API de provedor, com minimização e anonimização prévias, atrás de um gateway interno**. Prós: qualidade, rapidez. Contras: dados saem do ambiente (mitigados).
2. **Modelos auto-hospedados**. Prós: dados não saem. Contras: custo, qualidade e operação.
3. **Híbrido**: auto-hospedado para o que for sensível, API para o resto.

## Decisão (proposta)
Opção 1 no início, com gateway interno que (a) mascara identificadores antes do envio, (b) registra o que foi enviado sem guardar conteúdo pessoal, (c) permite trocar o provedor, (d) aplica contrato que veda treinamento com dados. Reavaliar a opção 3 conforme volume e exigências jurídicas. Detalhes em `ai-strategy.md`.

## Consequências
Dependência de provedor mitigada pelo gateway. Exige parecer jurídico sobre operadores e transferência internacional.
