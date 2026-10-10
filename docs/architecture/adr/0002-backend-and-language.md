# ADR-0002: Backend: NestJS como núcleo, Python como complemento

- Status: aceita (por decisão do produto)
- Data: 2026-10-10

## Contexto
Decisão do produto: unificar o backend em NestJS, com as regras fiscais nele, e usar Python como complemento voltado a automação. O requisito de robôs locais de extração continua valendo e é onde o ecossistema Python (OCR, PDF, visão computacional) mais ajuda.

## Decisão
| Componente | Linguagem | Responsabilidade |
|---|---|---|
| Backend principal | NestJS (TypeScript) | Contas e pessoas, autenticação/autorização, **catálogo de regras fiscais, validações, simulação e cálculo**, orquestração de documentos, API do Nuxt, auditoria, gateway de IA |
| Robôs de automação | Python | OCR, leitura de PDF, parsers por emissor, normalização de campos, pré-processamento de imagem, avaliação de extração |

Regras de fronteira:

1. **Fonte única da regra fiscal: NestJS.** Nenhuma constante ou lógica fiscal em Python, no Nuxt ou em scripts.
2. Python **extrai e normaliza; não decide**. Devolve campos com valor, página, trecho e confiança. Validações fiscais, limites e alertas rodam no Nest sobre o que o robô devolveu.
3. Comunicação por **fila de tarefas** com mensagens em JSON Schema versionado (tarefa e resultado), sem API HTTP síncrona exposta. Python não acessa o banco de dados principal; lê o documento por URL assinada de curta duração e devolve o resultado pela fila.
4. Robôs rodam em contêineres isolados, sem acesso a segredos além do necessário e com rede restrita.
5. Cada resultado registra a versão do robô, permitindo reprocessar.
6. Se um dia houver necessidade de endpoint Python (ex.: avaliação), será interno e documentado em novo ADR.

## Consequências
- Um só lugar para regra fiscal, validação e simulação, na linguagem do backend principal e do frontend (TypeScript permite compartilhar tipos e contratos com o Nuxt).
- Python isolado em um papel estreito e substituível; falha ou troca de robô não afeta a regra fiscal.
- Custo: duas toolchains, mas com contrato pequeno (mensagens de fila).
- Risco: perder ferramentas numéricas do Python não é problema aqui, pois o cálculo fiscal é aritmética simples; atenção a precisão decimal no TypeScript (usar tipo decimal, nunca ponto flutuante para dinheiro).

## Alternativas descartadas
- Núcleo fiscal em Python (proposta anterior): descartada pela decisão de unificar no Nest.
- Python em tudo: descartada pela preferência do produto.
