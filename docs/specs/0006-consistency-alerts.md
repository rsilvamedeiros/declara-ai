# SPEC-0006: Alertas e validações de consistência (V-005 e V-011)

- Status: implementada
- Requisitos: RF-041, RF-042, RNF-020, RNF-021, RNF-012; validações V-005 e V-011 de `docs/domain/validations-catalog.md`
- Fase do roadmap: 1 (MVP), quinta fatia

## Problema
O catálogo de validações define a estrutura de um alerta e várias validações, mas nada disso existe em código. Esta fatia cria o modelo de alerta (severidade, campos envolvidos, estado, justificativa) e as duas validações que **não dependem de regra fiscal nem de valor oficial**: soma de campos incoerente com o total do documento (V-005) e divergência entre valor extraído e valor digitado manualmente (V-011). As demais ficam para specs próprias (V-003, V-004 e V-010 aguardam `TODO(fonte)`; V-012 aguarda a spec de extração com `confidence`).

## Fora de escopo
- Validações que dependem de regra do catálogo (V-003, V-004, V-008, V-010) e V-006, V-009, V-012.
- Persistência de alertas, API e interface.
- Qualquer correção automática de valor: validação só sinaliza e sugere (princípio do catálogo).

## Comportamento

### Entidades (TypeScript, `packages/tax-core`)
- `Alert`: `validationId` (`V-005` | `V-011`), `severity` (`error` | `warning` | `notice`), `code` (identificador estável da mensagem, sem texto livre nem valores), `fields` (lista de referências `{ personId, year, key }` aos campos envolvidos, mais `documentIds` quando houver), `suggestedAction` (`fix_value` | `attach_document` | `justify`) e `state` (`open` | `resolved` | `justified`).
- A mensagem em linguagem simples é montada pela interface a partir de `code`; o alerta não carrega valores monetários nem trechos de documento (RNF-012).

### Validações (funções puras, usam `FieldValue` da SPEC-0002)
- `checkSumMatchesTotal(parts, total)` (V-005, severidade `warning`): `parts` são campos utilizáveis do mesmo documento e `total` é o campo de total desse documento. Se a soma dos valores `Money` das partes for diferente do total (comparação exata em centavos), devolve um alerta; senão, nada. Campos que não sejam `Money`, ou de pessoa/ano diferentes, rejeitam com erro explícito. Campos não utilizáveis (`extracted`, `rejected`) são ignorados, e sem total utilizável não há alerta.
- `checkExtractedVsManual(fields)` (V-011, severidade `warning`): para cada chave de pessoa e ano com um campo manual utilizável e um campo de origem documento não rejeitado, se os valores diferirem devolve um alerta; valores iguais não geram alerta. Três ou mais campos na mesma chave geram um único alerta.

### Estado do alerta
- `resolveAlert(alert)`: `open` → `resolved` (o dado foi corrigido).
- `justifyAlert(alert, justification)`: `open` → `justified`, exigindo justificativa não vazia; a justificativa é dado do usuário e fica fora do `Alert` (a camada de persistência a guarda, com auditoria).
- Qualquer outra transição é rejeitada. Funções puras: devolvem nova instância.

## Critérios de aceite
- [x] CA-1: `checkSumMatchesTotal` não gera alerta quando a soma bate exatamente e gera `V-005` quando difere em um centavo.
- [x] CA-2: `checkSumMatchesTotal` ignora campos `extracted`/`rejected`, não gera alerta sem total utilizável e rejeita campos que não sejam `Money` ou de pessoa/ano diferentes.
- [x] CA-3: `checkExtractedVsManual` gera `V-011` quando manual e documento divergem, não gera quando coincidem e ignora campos `rejected`.
- [x] CA-4: três campos na mesma chave geram um único alerta; chaves, pessoas e anos diferentes nunca se misturam.
- [x] CA-5: transições `open` → `resolved` e `open` → `justified` funcionam; `justifyAlert` rejeita justificativa vazia; qualquer outra transição é rejeitada.
- [x] CA-6: alertas e erros não contêm valor monetário, trecho do documento nem justificativa (RNF-012).
- [x] CA-7: o pacote continua puro, sem dependência de runtime (ADR-0001).

## Regras fiscais envolvidas
Nenhuma. As validações são aritméticas e de consistência entre campos.

## Dados e contratos
Tipos exportados por `tax-core`. O contrato HTTP dos alertas entra em `packages/contracts` em spec própria.

## Segurança e privacidade
- Alertas referenciam campos por chave, pessoa e ano; não repetem os dados.
- Testes usam apenas valores e trechos fictícios.

## Plano de testes
- Vitest: cada validação (caso que bate, caso que diverge, campos ignorados) e as transições de estado.
- fast-check: para qualquer lista de partes `Money`, `checkSumMatchesTotal` com total igual à soma nunca gera alerta; `checkExtractedVsManual` é invariante à ordem dos campos.

## Riscos e perguntas abertas
- Decidido: V-005 compara em centavos, sem tolerância; quando o documento arredonda, o usuário justifica o alerta.
- Decidido: V-005 e V-011 ficam como `warning` ("Alerta" do catálogo), com `fix_value` ou `justify` como ação sugerida.
- Risco: sem identificador próprio, `FieldValue` é referenciado por chave, pessoa e ano; se a mesma chave tiver várias linhas legítimas (ex.: vários recibos), a spec do catálogo de campos por ficha precisa definir identidade.
