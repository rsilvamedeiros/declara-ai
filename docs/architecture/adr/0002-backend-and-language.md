# ADR-0002: Linguagem e framework do backend

- Status: proposta
- Data: 2026-10-10

## Contexto
O requisito pede robôs locais em Python para extração e validação, além de APIs internas. Conviver com duas linguagens no núcleo aumenta custo e risco de divergência de regra.

## Opções
1. **Python (FastAPI) para API, núcleo fiscal e robôs**. Prós: uma linguagem para tudo, ecossistema forte de OCR/PDF/ML, tipagem com Pydantic, testes com pytest. Contras: desempenho menor que linguagens compiladas (aceitável para este perfil).
2. **TypeScript (Node) na API e Python só nos robôs**. Prós: mesma linguagem do front. Contras: regra fiscal e validação duplicadas ou chamadas entre linguagens.
3. **Go/Java/.NET na API e Python nos robôs**. Prós: desempenho e tipagem forte. Contras: duas linguagens e mais custo.

## Decisão (proposta)
Opção 1: Python em todo o backend, com tipagem estática (mypy ou equivalente), formatação e lint automáticos, e testes com pytest.

## Consequências
Núcleo fiscal compartilhado entre API, robôs e simuladores públicos sem duplicação. Risco: disciplina de tipos e de limites de módulo.
