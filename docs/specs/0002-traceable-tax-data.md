# SPEC-0002: Dado fiscal rastreável

- Status: rascunho
- Requisitos: RF-022, RF-023, RF-030, RF-031, RF-032, RNF-021, RNF-022
- Fase do roadmap: 1 (MVP), segunda fatia

## Problema
Todo valor que entra na declaração precisa dizer de onde veio (documento, página e trecho, ou digitação manual) e em que estado de confirmação está. Sem esse modelo, extração, validação e simulação não têm onde apoiar a rastreabilidade exigida por RNF-021 nem a regra de que saída de IA não vira valor fiscal sem confirmação (RNF-022). Esta fatia define o modelo de domínio puro, antes de banco, API ou extração real.

## Fora de escopo
- Persistência (tabelas, RLS, migrações), endpoints HTTP e upload de documentos.
- Extração real (OCR, PDF, IA) e cálculo de confiança.
- Fichas do IRPF e suas regras: o modelo é genérico; o catálogo de campos por ficha vem em specs próprias.
- Cônjuge e dependentes (Fase 2): o modelo já nasce com `Person`, mas só o titular é exercitado.
- Qualquer regra de imposto, limite ou arredondamento fiscal.

## Comportamento

### Entidades (TypeScript, `packages/tax-core`)
- `Person`: id e `role` (`holder` nesta fatia). CPF opcional, validado por `validateCpf` (SPEC-0001).
- `TaxYear`: ano-calendário (inteiro de quatro dígitos) ao qual os dados pertencem. O ano de exercício não é guardado; é derivado (calendário + 1) quando necessário.
- `SourceDocument`: id, `type` (ex.: `income_report`, `medical_receipt`), pessoa, ano-calendário e `contentHash` (usado depois para duplicidade, RF-024).
- `FieldValue`: um dado fiscal com
  - `key` (identificador do campo, string estável) e `value` (`Money` ou texto);
  - `origin`: `{ kind: "document", documentId, page, excerpt }` ou `{ kind: "manual", enteredAt }`;
  - `status`: `extracted` → `confirmed` | `corrected` | `rejected`; digitação manual nasce `confirmed`.
  - `previousValue` preservado quando o status vira `corrected`.
- Um campo `extracted` não é um valor fiscal utilizável: só `confirmed` e `corrected` são.

### Operações (funções puras, sem I/O)
- `createExtractedField(input)`: exige origem de documento com `documentId`, `page` ≥ 1 e `excerpt` não vazio; senão rejeita.
- `createManualField(input)`: origem manual, status `confirmed`.
- `confirmField`, `correctField(newValue)`, `rejectField`: transições válidas apenas a partir de `extracted`; qualquer outra transição é rejeitada. Retornam nova instância (imutável).
- `usableFields(fields)`: devolve apenas campos `confirmed` ou `corrected`.
- `valueFor(fields, personId, year, key)`: devolve o valor utilizável do campo ou `undefined`. Se houver mais de um campo utilizável para a mesma chave, pessoa e ano, rejeita com erro de ambiguidade em vez de escolher um (a escolha é do usuário na revisão).
- Todo campo referencia pessoa e ano; dados de anos diferentes nunca se misturam em `valueFor`.

## Critérios de aceite
- [ ] CA-1: `createExtractedField` aceita origem completa e rejeita ausência de `documentId`, `page` < 1 ou `excerpt` vazio.
- [ ] CA-2: `createManualField` produz campo `confirmed` com origem `manual`.
- [ ] CA-3: transições `extracted` → `confirmed` / `corrected` / `rejected` funcionam; qualquer transição a partir de outro estado é rejeitada.
- [ ] CA-4: `correctField` guarda o valor anterior em `previousValue` e não altera a instância original.
- [ ] CA-5: `usableFields` e `valueFor` nunca devolvem campo `extracted` ou `rejected`.
- [ ] CA-6: `valueFor` não mistura pessoas nem anos e falha de forma explícita quando há dois campos utilizáveis para a mesma chave.
- [ ] CA-7: propriedade: para qualquer sequência de operações válidas, o campo mantém origem e pessoa/ano inalterados.
- [ ] CA-8: o pacote não importa nada de framework, rede ou sistema de arquivos (continua puro, ADR-0001).

## Regras fiscais envolvidas
Nenhuma. O modelo é neutro quanto a regras; `key` não carrega semântica fiscal nesta fatia.

## Dados e contratos
- Tipos exportados por `tax-core`; sem contrato HTTP nem mensagem de fila nesta fatia.
- Quando a API expuser esses dados, o contrato entra em `packages/contracts` em spec própria.
- `excerpt` é trecho do documento e pode conter dado pessoal; por isso não deve ser logado (ver abaixo).

## Segurança e privacidade
- Testes usam apenas valores e trechos fictícios; nenhum documento ou dado real no repositório.
- `excerpt`, `value` e CPF são dados pessoais/fiscais: mensagens de erro e logs das funções não os incluem (RNF-012).
- Isolamento entre usuários (RNF-002) é responsabilidade da camada de persistência/autorização, fora desta fatia; o modelo apenas carrega `personId`.
- Impacto no modelo de ameaças: nenhum novo vetor; o modelo reforça RNF-022 ao tornar valor não confirmado inutilizável por construção.

## Plano de testes
- Vitest: unidade para cada operação e para os casos de erro.
- fast-check: propriedade CA-7 e geração de sequências de transições.
- Teste estático simples (CA-8): verificação das dependências do `package.json` do `tax-core`.

## Riscos e perguntas abertas
- TODO(pergunta): `value` deve aceitar também data e booleano já nesta fatia, ou apenas `Money` e texto? Proposta: só `Money` e texto; ampliar quando uma ficha exigir.
- TODO(pergunta): um campo `rejected` deve poder ser reaberto? Proposta: não; o usuário cria novo campo manual.
- TODO(pergunta): deve haver `confidence` no `FieldValue` já agora (RF-022, V-012)? Proposta: adiar para a spec de extração, para não fixar semântica sem o extrator.
- Risco: modelar `key` livre pode permitir chaves inconsistentes; mitigado quando o catálogo de campos por ficha existir.
