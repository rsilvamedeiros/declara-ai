# ADR-0003: Frontend: Nuxt

- Status: aceita (por decisão do produto)
- Data: 2026-10-10

## Contexto
Área pública com conteúdo educativo (SEO importa) e área logada com fluxos ricos (upload, revisão de campos, alertas). Responsivo e acessível. Preferência do produto: Nuxt.

## Decisão
**Nuxt (Vue 3, TypeScript)**:

- Renderização no servidor / geração estática na área pública (SEO e desempenho), SPA na área logada.
- Conteúdo educativo em Markdown versionado (Nuxt Content), com fonte oficial e ano em cada regra.
- Nenhuma regra fiscal no front: cálculos e validações vêm da API.
- Cliente da API tipado e gerado a partir do OpenAPI do NestJS.

Observação: Nuxt é o equivalente em Vue do que o Next.js é em React; são frameworks distintos com propostas parecidas.

## Consequências
Boa experiência de SEO e conteúdo. Ecossistema Vue; a equipe precisa dominar Vue. Ver ADR-0009 para a camada de UI.
