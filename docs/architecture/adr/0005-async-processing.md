# ADR-0005: Processamento assíncrono e robôs locais

- Status: proposta
- Data: 2026-10-10

## Contexto
Extração é lenta e variável; pico sazonal; documentos são entrada não confiável e devem ser processados isolados.

## Opções
1. **Fila de tarefas com workers Python (robôs de automação) em contêineres isolados, com mensagens em JSON Schema versionado**. Prós: escala horizontal, isolamento, reprocessamento. Contras: infraestrutura de fila.
2. **Processamento síncrono na requisição**. Contras: timeouts, sem reprocessamento.

## Decisão (proposta)
Opção 1. Pipeline por etapas idempotentes: validação do arquivo, OCR/parsers determinísticos, IA para o resíduo, normalização. Cada etapa registra versão do robô e do modelo usados, permitindo reprocessar. Workers sem acesso a segredos além do necessário e com rede restrita.

## Consequências
Experiência assíncrona (status de processamento). Observabilidade de filas necessária.
