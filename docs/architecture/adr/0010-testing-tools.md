# ADR-0010: Ferramentas de teste

- Status: aceita (Cypress por decisão do produto; demais, aprovadas em bloco em 2026-10-13)
- Data: 2026-10-10

## Contexto
Preferência do produto: Cypress e mais uma ferramenta à escolha. O projeto tem três runtimes (Nuxt, NestJS, Python) e exige TDD.

## Decisão
| Camada | Ferramenta |
|---|---|
| E2E e testes de componente do front | **Cypress** |
| Unitários e integração em TypeScript (Nuxt e NestJS) | **Vitest** (escolha da engenharia: rápido, TypeScript nativo, mesma ferramenta nos dois projetos) |
| Robôs Python (extração, parsers) | **pytest** com Hypothesis (propriedades) |
| Núcleo fiscal (Nest) | Vitest, com testes baseados em propriedades (fast-check) e casos da fonte oficial |
| Contrato Nest x robôs Python | JSON Schema das mensagens de tarefa e resultado, validado nos dois lados |
| Contrato Nest x Nuxt | OpenAPI do Nest, cliente tipado gerado |
| Acessibilidade | axe integrado ao Cypress |

Todos rodam em CI; TDD conforme `docs/engineering/process.md`.

## Consequências
Um runner de unidade para todo o TypeScript e outro para Python; Cypress concentrado em jornadas críticas. NestJS usa Vitest com plugin de compilação adequado a decorators (verificar na configuração inicial). Alternativa: Jest no Nest, se o atrito for alto.
