# declara-ai

Cofre fiscal pessoal para a declaração de IRPF (Brasil). Guarda documentos, extrai dados rastreáveis, valida inconsistências, simula e entrega um roteiro de preenchimento.

Diretrizes do projeto: [`CLAUDE.md`](CLAUDE.md). Documentação: [`docs/`](docs/).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `apps/web` | Nuxt.js (Tailwind + shadcn-vue): área pública e área logada |
| `apps/api` | NestJS: backend principal, organizado em módulos de domínio |
| `workers/extraction` | Robôs Python de extração (OCR, PDF, parsers). Opcional no início |
| `packages/tax-core` | Núcleo fiscal puro em TypeScript: cálculo, validações, simulação. Sem dependência de framework |
| `packages/tax-rules` | Catálogo de regras fiscais por ano-calendário (dados versionados, com fonte oficial) |
| `packages/contracts` | Contratos: OpenAPI e JSON Schema de mensagens |
| `e2e` | Testes ponta a ponta (Cypress) |
| `infra` | Infraestrutura como código e observabilidade |
| `tools` | Scripts de SEO e segurança (a gerar depois) |
| `docs` | Produto, domínio, requisitos, arquitetura, engenharia, especificações |

Decisões em [`docs/architecture/adr/`](docs/architecture/adr/), em especial o ADR-0013.
