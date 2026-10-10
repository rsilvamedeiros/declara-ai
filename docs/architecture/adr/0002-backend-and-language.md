# ADR-0002: Backend: NestJS e Python

- Status: aceita (stack, por decisão do produto); fronteira entre os dois: proposta
- Data: 2026-10-10

## Contexto
Decisão do produto: backend com Python e Node/NestJS. O requisito pede robôs locais em Python para extração e validação. Duas linguagens no backend elevam o risco de a mesma regra fiscal existir em dois lugares e divergir.

## Decisão
Divisão por responsabilidade, com **fonte única da regra fiscal em Python**:

| Serviço | Linguagem | Responsabilidade |
|---|---|---|
| API principal | NestJS (TypeScript) | Contas e pessoas, autenticação/autorização, orquestração de documentos, API consumida pelo Nuxt, auditoria, conteúdo, integração com o gateway de IA |
| Serviço fiscal e de extração | Python (FastAPI, uso interno) | Catálogo de regras, validações, simulação, cálculo, robôs de OCR/parsers, pipeline de extração |

Regras de fronteira:

1. Constantes e lógica fiscal existem **somente** no serviço Python. NestJS e Nuxt nunca calculam imposto nem validam limites; chamam o serviço.
2. O serviço Python é interno (não exposto à internet), acessado apenas pela API NestJS e pelos workers.
3. Contrato entre os dois definido por OpenAPI, com testes de contrato em CI nos dois lados.
4. Validações de formato genéricas no Nest (ex.: campos obrigatórios) são permitidas; validações fiscais (CPF/CNPJ no contexto fiscal, limites, alertas) vêm do serviço Python.
5. Workers de processamento são Python.

## Consequências
Cada linguagem faz o que faz melhor (Nest: produto e API; Python: núcleo fiscal e documentos). Custo: duas toolchains, um contrato interno a manter e uma chamada de rede a mais. Risco mitigado por contrato testado e por teste de arquitetura que impede constantes fiscais fora do serviço Python.

## Alternativas descartadas
- Python em tudo: recomendação inicial, preterida pela preferência do produto por NestJS.
- Núcleo fiscal duplicado em TS: descartado pelo risco de divergência.
