# ADR-0003: Frontend

- Status: proposta
- Data: 2026-10-10

## Contexto
Área pública com conteúdo educativo (SEO importa) e área logada com fluxos ricos (upload, revisão de campos, alertas). Responsivo e acessível.

## Opções
1. **React com framework full-stack (ex.: Next.js) em TypeScript**: SSR/SSG para a área pública, SPA na área logada. Prós: SEO, ecossistema, acessibilidade madura. Contras: complexidade do framework.
2. **SPA pura**. Contras: SEO e desempenho inicial pior na área pública.
3. **Renderização no servidor com HTMX/templates**. Prós: simples, menos JS. Contras: fluxos de revisão de documento ficam mais difíceis.

## Decisão (proposta)
Opção 1, usando o framework apenas como camada de apresentação: nenhuma regra fiscal no front. Cálculos vêm da API. Contratos da API tipados e gerados de especificação OpenAPI.

## Consequências
Duas linguagens (TS no front, Python no back) com contrato explícito. Conteúdo público indexável.
