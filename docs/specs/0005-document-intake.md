# SPEC-0005: Recepção de documentos (validação de envio e duplicidade)

- Status: implementada
- Requisitos: RF-020, RF-021, RF-024, RNF-006, RNF-012; validação V-007 de `docs/domain/validations-catalog.md`
- Fase do roadmap: 1 (MVP), quarta fatia

## Problema
Antes de qualquer extração, todo arquivo enviado precisa ser tratado como não confiável (RNF-006), ficar associado a uma pessoa e a um ano-calendário (RF-020) e ter seu conteúdo identificado por hash para avisar de duplicidade (RF-024, V-007). Esta fatia define a **regra de domínio pura** dessa recepção, sem upload HTTP, armazenamento nem leitura de arquivo.

## Fora de escopo
- Endpoint de upload, armazenamento do arquivo, criptografia em repouso e antivírus (infraestrutura, ADRs próprios).
- Cálculo do hash (feito pela camada de infraestrutura; o domínio recebe o hash pronto).
- Extração de campos e classificação sugerida do tipo (RF-021 fica para a spec de extração; aqui o tipo é informado).
- Lista de documentos esperados x recebidos (RF-025).

## Comportamento

### Entidades (TypeScript, `packages/tax-core`)
- `UploadCandidate`: `fileName`, `declaredMime`, `sizeBytes`, `headBytes` (primeiros bytes do arquivo, para verificar a assinatura) e `contentHash` (hex SHA-256 calculado fora do domínio).
- `IntakeLimits`: `maxSizeBytes` e a lista de tipos aceitos. Os limites são parâmetros, não constantes embutidas.
- Reutiliza `SourceDocument` da SPEC-0002 (id, tipo, pessoa, ano, `contentHash`).

### Operações (funções puras)
- `validateUpload(candidate, limits)`: devolve `{ ok: true, mime }` ou `{ ok: false, reason }`, com `reason` em `empty_file`, `too_large`, `unsupported_type`, `mime_mismatch`, `invalid_hash`. O tipo real vem da assinatura dos primeiros bytes (ex.: `%PDF-`, PNG, JPEG); o MIME declarado só é aceito se coincidir com a assinatura. Extensão do nome não decide nada.
- `registerDocument(candidate, meta, existing)`: aplica `validateUpload`, exige `personId` e ano-calendário válido e devolve o `SourceDocument` novo. Não rejeita duplicado: devolve também `duplicateOf` (id do documento existente de mesma pessoa, ano e hash), para o sistema avisar (V-007) e o usuário decidir.
- `findDuplicate(existing, personId, year, contentHash)`: devolve o documento existente ou `undefined`. O mesmo conteúdo em outra pessoa ou outro ano **não** é duplicado.

## Critérios de aceite
- [x] CA-1: arquivo vazio, acima do limite, de tipo não aceito ou com hash que não seja SHA-256 hexadecimal é rejeitado com o `reason` correspondente.
- [x] CA-2: o tipo é decidido pela assinatura; MIME declarado diferente da assinatura é `mime_mismatch`, e a extensão do nome é ignorada.
- [x] CA-3: `registerDocument` devolve `SourceDocument` com pessoa, ano e hash, e não altera a lista `existing`.
- [x] CA-4: mesmo hash, mesma pessoa e mesmo ano devolve `duplicateOf`; mesmo hash em outra pessoa ou outro ano não.
- [x] CA-5: mensagens de erro e resultados não incluem nome do arquivo nem bytes do conteúdo (RNF-012).
- [x] CA-6: o pacote continua puro, sem dependência de runtime nem de `node:crypto` (ADR-0001).

## Regras fiscais envolvidas
Nenhuma.

## Dados e contratos
Tipos exportados por `tax-core`. `fileName` é dado do usuário e pode conter informação pessoal; não é retornado nem logado pelas funções. Contrato HTTP em spec própria.

## Segurança e privacidade
- Tratamento do arquivo como não confiável: decisão de tipo pela assinatura, nunca pelo nome ou MIME informado.
- Testes usam apenas bytes sintéticos; nenhum documento real no repositório.
- Isolamento do processamento (RNF-006) é responsabilidade da infraestrutura; esta fatia só fornece a regra de aceitação.

## Plano de testes
- Vitest: cada motivo de rejeição, assinaturas válidas e inválidas, duplicidade por pessoa e ano.
- fast-check: o resultado de `validateUpload` nunca depende de `fileName`; `findDuplicate` só devolve documento com mesma pessoa, ano e hash.

## Riscos e perguntas abertas
- Decidido: tipos aceitos no MVP são PDF, PNG e JPEG.
- Decidido: limite padrão de 20 MB por arquivo, configurável por `IntakeLimits`.
- Decidido: documento duplicado só gera aviso (V-007); não bloqueia o envio.
- Risco: a assinatura dos primeiros bytes não prova que o arquivo é benigno; a verificação profunda e o isolamento ficam na infraestrutura.
