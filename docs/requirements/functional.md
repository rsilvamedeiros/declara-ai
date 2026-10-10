# Requisitos funcionais

Status: rascunho. Prioridade: M = MVP (Fase 1), P2/P3/P4 = fases do roadmap. Cada requisito vira uma especificação (SDD) antes de ser implementado.

## Área pública

| id | Requisito | Prio |
|---|---|---|
| RF-001 | Conteúdo educativo sobre fichas, regras e conceitos do IRPF, cada regra com fonte oficial e ano | M |
| RF-002 | Tabelas e limites por ano, vindos do catálogo de regras | M |
| RF-003 | Simulador aberto simples, sem login e sem guardar dados | M |
| RF-004 | Cadastro e entrada na conta | M |

## Conta e pessoas

| id | Requisito | Prio |
|---|---|---|
| RF-010 | Cadastro do titular | M |
| RF-011 | Cadastro de cônjuge e dependentes | P2 |
| RF-012 | Seleção do ano-calendário de trabalho | M |
| RF-013 | Exportação e exclusão dos dados do usuário | M |

## Documentos

| id | Requisito | Prio |
|---|---|---|
| RF-020 | Envio de documentos por upload, associado a pessoa e ano | M |
| RF-021 | Classificação do tipo de documento (sugerida, confirmada pelo usuário) | M |
| RF-022 | Extração de campos com origem (página, trecho) e confiança | M |
| RF-023 | Revisão: o usuário confirma, corrige ou rejeita cada campo | M |
| RF-024 | Detecção de documento duplicado | M |
| RF-025 | Lista de documentos esperados x recebidos | M |

## Dados fiscais

| id | Requisito | Prio |
|---|---|---|
| RF-030 | Entrada manual dos dados de cada ficha coberta | M |
| RF-031 | Cada dado tem origem: documento ou digitação manual | M |
| RF-032 | Histórico por ano-calendário | M |
| RF-033 | Importação da declaração do ano anterior | P2 |

## Validação e regras

| id | Requisito | Prio |
|---|---|---|
| RF-040 | Aplicar as regras do ano-calendário correto, vindas do catálogo | M |
| RF-041 | Gerar alertas conforme o catálogo de validações | M |
| RF-042 | Resolver ou justificar alertas, com registro | M |
| RF-043 | Explicar ao usuário cada regra aplicada, com fonte oficial | M |
| RF-044 | Monitorar mudanças de normas e indicar impacto (com revisão humana) | P4 |

## Simulação e entrega

| id | Requisito | Prio |
|---|---|---|
| RF-050 | Simulação completo x simplificado | M |
| RF-051 | Projeção do imposto do ano em curso | P4 |
| RF-052 | Roteiro de preenchimento ficha a ficha | M |
| RF-053 | Pacote organizado de comprovantes | P4 |

## Fora de escopo

Transmitir a declaração e gerar o arquivo oficial.
