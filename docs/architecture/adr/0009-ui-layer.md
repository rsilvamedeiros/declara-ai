# ADR-0009: Camada de UI: Tailwind CSS e shadcn

- Status: aceita (por decisão do produto)
- Data: 2026-10-10

## Contexto
Preferência do produto, confirmada: Tailwind CSS com **shadcn-vue** (Nuxt.js). O shadcn original é para React; para Nuxt/Vue usa-se a porta comunitária shadcn-vue, baseada em Reka UI (antes Radix Vue).

## Decisão
Tailwind CSS + **shadcn-vue** (componentes copiados para o repositório, não dependência fechada), com tokens de design em variáveis CSS e tema claro/escuro. Acessibilidade conforme WCAG como requisito dos componentes (RNF-041).

## Consequências
Controle total dos componentes e do visual. Os componentes passam a ser código nosso, com manutenção e testes próprios. TODO(fonte): confirmar versão e mantenedores atuais do shadcn-vue antes de adotar.
