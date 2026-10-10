# Visão de arquitetura

Status: proposta. Decisões específicas estão nos ADRs (`adr/`). Nada aqui está aceito até o ADR correspondente ser aprovado.

## Direcionadores

Vêm dos requisitos (`docs/requirements/`):

1. Privacidade e segurança como requisito central (dados fiscais, de saúde e de dependentes).
2. Correção fiscal determinística, versionada por ano, com fonte oficial.
3. Rastreabilidade de todo valor até o documento de origem.
4. IA como apoio, nunca como fonte final de valores.
5. Multiusuário com isolamento total (produto para terceiros).
6. Duas áreas: pública (educativa) e logada.
7. Pico sazonal perto do prazo de entrega.

## Contexto

Atores: visitante, usuário logado, equipe interna (curadoria de regras, suporte). Sistemas externos: provedor de IA, provedor de e-mail, fontes oficiais (consulta e curadoria, sem integração automática de valores).

## Módulos (fronteiras lógicas)

| Módulo | Responsabilidade |
|---|---|
| Identidade e conta | Cadastro, autenticação, pessoas (titular, dependentes), consentimentos |
| Documentos | Recepção, armazenamento, hash, deduplicação, metadados |
| Extração | Pipeline em etapas: robôs locais determinísticos (OCR, parsers por emissor, validação de formato) e depois IA para o que sobrar; produz campos com origem e confiança |
| Dados fiscais | Modelo por pessoa e ano, origem de cada dado, revisão do usuário |
| Regras fiscais | Catálogo versionado por ano, com fonte oficial; único lugar com constantes fiscais |
| Validação | Executa o catálogo de validações sobre os dados |
| Simulação | Cálculo completo x simplificado e projeção |
| Roteiro e pacote | Gera o roteiro ficha a ficha e o pacote de comprovantes |
| Conteúdo público | Material educativo e simuladores abertos, alimentados pelo catálogo de regras |
| Auditoria | Registro de acessos e alterações |
| Curadoria de mudanças | Fila de normas novas e impacto, com revisão humana (fase posterior) |

Regra de dependência: o **módulo de regras fiscais e o de cálculo/validação não dependem** de IA, de armazenamento nem de interface. Eles são funções puras testáveis.

## Serviços e stack (ver ADRs 0001, 0002, 0003, 0009)

- **Nuxt** (Vue/TypeScript, Tailwind + shadcn-vue): área pública e área logada.
- **API NestJS**: produto, contas, documentos, orquestração. Única porta de entrada para o front.
- **Serviço fiscal e de extração (Python/FastAPI)**: fonte única da regra fiscal, validações, simulação e robôs. Interno.
- **Workers Python** com fila para o processamento de documentos.
- Observabilidade: OpenTelemetry + Grafana/Loki/Prometheus (ADR-0011).

## Fluxo de um documento

1. Upload autenticado, com verificação de tipo, tamanho e malware.
2. Armazenamento cifrado e registro (hash, pessoa, ano).
3. Fila de processamento isolado.
4. Etapa determinística: OCR, parsers e validações de formato.
5. Etapa de IA, somente para o resíduo, com minimização/anonimização.
6. Campos extraídos com origem e confiança.
7. Revisão e confirmação do usuário.
8. Dados confirmados alimentam validação, simulação e roteiro.

## Qualidade e testes

TDD e SDD conforme `docs/engineering/`. Regras e validações com casos de fonte oficial; extração com conjunto sintético/anonimizado.

## Pendências

- Aprovação dos ADRs.
- TODO(pergunta): orçamento e restrições de provedor.
