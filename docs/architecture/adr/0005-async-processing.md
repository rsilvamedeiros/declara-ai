# ADR-0005: Processamento assíncrono e robôs locais

- Status: aceita (aprovada em bloco pelo dono do projeto, 2026-10-13)
- Data: 2026-10-10

## Contexto
Extração é lenta e variável; pico sazonal; documentos são entrada não confiável e devem ser processados isolados.

## Opções
1. **Fila de tarefas com workers Python (robôs de automação) em contêineres isolados, com mensagens em JSON Schema versionado**. Prós: escala horizontal, isolamento, reprocessamento. Contras: infraestrutura de fila.
2. **Processamento síncrono na requisição**. Contras: timeouts, sem reprocessamento.

## Decisão (proposta)
Opção 1. Pipeline por etapas idempotentes: validação do arquivo, OCR/parsers determinísticos, IA para o resíduo, normalização. Cada etapa registra versão do robô e do modelo usados, permitindo reprocessar. Workers sem acesso a segredos além do necessário e com rede restrita.

## Observação
Os workers Python são opcionais no início (ADR-0002): a extração começa atrás de uma interface de extrator no Nest e o robô Python entra quando o OCR de imagens for necessidade medida. A fila e o contrato de mensagens valem desde que o primeiro robô assíncrono exista.

## Consequências
Experiência assíncrona (status de processamento). Observabilidade de filas necessária.
