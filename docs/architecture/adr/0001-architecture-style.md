# ADR-0001: Estilo de arquitetura

- Status: proposta
- Data: 2026-10-10

## Contexto
Produto novo, equipe pequena, domínio com regras complexas e fronteiras claras, pico sazonal, processamento pesado e isolado de documentos.

## Opções
1. **Monólito modular** com um worker separado para processamento de documentos. Prós: simples de operar e testar, fronteiras por módulo, evolução para serviços depois. Contras: exige disciplina para manter as fronteiras.
2. **Microsserviços desde o início**. Prós: escala independente. Contras: custo operacional alto, consistência distribuída, desnecessário para o estágio atual.

## Decisão (proposta)
Opção 1: monólito modular, mais um worker de processamento assíncrono. Módulos do `overview.md` com dependências verificadas por teste de arquitetura. O núcleo fiscal (regras, validação, cálculo) fica em módulo independente e puro.

## Consequências
Menos infraestrutura inicial; possibilidade de extrair módulos depois. Risco: acoplamento se as fronteiras não forem checadas em CI.
