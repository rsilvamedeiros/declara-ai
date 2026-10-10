# workers/extraction

Robôs Python de automação: OCR, leitura de PDF, parsers por emissor, normalização de campos. ADRs 0002 e 0005.

- **Extrai e normaliza; não decide.** Sem lógica fiscal.
- Recebe tarefas por fila e devolve resultados em JSON Schema versionado (`packages/contracts`).
- Lê o documento por URL assinada de curta duração; não acessa o banco principal.
- Roda em contêiner isolado, com rede restrita.
- Registra a versão do robô em cada resultado.

Status: opcional no início. Entra quando o OCR de imagens for necessidade medida (ver ADR-0002 e `docs/architecture/overview.md`).
