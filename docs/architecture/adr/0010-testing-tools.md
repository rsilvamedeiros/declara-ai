# ADR-0010: Ferramentas de teste

- Status: proposta (Cypress por decisão do produto; demais, escolha da engenharia)
- Data: 2026-10-10

## Contexto
Preferência do produto: Cypress e mais uma ferramenta à escolha. O projeto tem três runtimes (Nuxt, NestJS, Python) e exige TDD.

## Decisão
| Camada | Ferramenta |
|---|---|
| E2E e testes de componente do front | **Cypress** |
| Unitários e integração em TypeScript (Nuxt e NestJS) | **Vitest** (escolha da engenharia: rápido, TypeScript nativo, mesma ferramenta nos dois projetos) |
| Unitários, propriedades e integração em Python | **pytest** com Hypothesis (propriedades) |
| Contrato Nest x serviço Python | Testes de contrato sobre o OpenAPI (ex.: Schemathesis) |
| Acessibilidade | axe integrado ao Cypress |

Todos rodam em CI; TDD conforme `docs/engineering/process.md`.

## Consequências
Um runner de unidade para todo o TypeScript e outro para Python; Cypress concentrado em jornadas críticas. NestJS usa Vitest com plugin de compilação adequado a decorators (verificar na configuração inicial). Alternativa: Jest no Nest, se o atrito for alto.
