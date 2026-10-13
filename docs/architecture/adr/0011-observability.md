# ADR-0011: Logs e observabilidade open source

- Status: aceita (aprovada em bloco pelo dono do projeto, 2026-10-13)
- Data: 2026-10-10

## Contexto
Preferência: ferramenta open source para logs. Restrição forte: **log sem dados pessoais ou fiscais** (RNF-012).

## Decisão
- **Instrumentação**: OpenTelemetry nos três runtimes.
- **Logs estruturados**: Pino (NestJS e servidor Nuxt) e structlog (Python), em JSON, com id de correlação por requisição.
- **Coleta e armazenamento**: Grafana Loki (logs), Prometheus (métricas), Tempo (traces); visualização e alertas no **Grafana**. Todos open source.
- **Redação de PII na origem**: lista de campos proibidos e mascaramento no logger; teste automatizado que falha se CPF/CNPJ aparecer em log. Logs de erro nunca incluem conteúdo de documentos nem prompts.
- Retenção de logs curta e definida. TODO(pergunta).

## Alternativas
OpenSearch/ELK (mais pesado) e OpenObserve (mais simples, mais novo). Reavaliar se o custo operacional do Grafana for alto.

## Consequências
Pilha única e aberta. Exige operar o Loki/Grafana ou usar oferta gerenciada com os mesmos componentes.
