# packages/tax-core

Núcleo fiscal puro em TypeScript: cálculo, validações, simulação. ADR-0002 e ADR-0013.

- Funções puras, sem Nest, sem I/O, sem relógio ou aleatoriedade implícitos.
- Dinheiro em tipo decimal, nunca ponto flutuante.
- Lê regras apenas de `packages/tax-rules`; nenhuma constante fiscal hardcoded.
- Testes: Vitest, fast-check e casos da fonte oficial (TDD).

Status: não inicializado.
