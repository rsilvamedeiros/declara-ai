# SPEC-0004: Modelo do catálogo de regras fiscais

- Status: implementada
- Requisitos: RF-040, RF-043, RNF-020, RNF-021, RNF-023
- Fase do roadmap: 1 (MVP), terceira fatia

## Problema
Toda regra fiscal precisa vir de um catálogo versionado, com vigência e fonte oficial (`docs/domain/rules-catalog.md`), e todo resultado precisa listar as regras (id e versão) que usou. Hoje não existe estrutura de código para isso. Esta fatia define só o **modelo e a consulta por ano**, sem nenhum valor fiscal, para que as regras reais entrem depois, uma família por vez, cada uma com sua fonte.

## Fora de escopo
- Qualquer valor de regra (tabelas, faixas, limites, alíquotas). Entram em specs próprias, com fonte oficial e casos de teste da fonte.
- Cálculo de imposto, simulador e validações.
- Persistência, API, fluxo de revisão humana e monitoramento de normas (RF-044).

## Comportamento

### Entidades (TypeScript, `packages/tax-rules`)
- `Rule`: `id` estável (ex.: `deducao.dependente`), `title`, `description`, `kind` (`table`, `limit`, `rate`, `condition`, `deadline`), `fromYear` e `toYear` opcional (ano-calendário, inclusive), `value` (estrutura serializável, opaca ao catálogo), `source`, `version` (inteiro ≥ 1) e `status` (`draft`, `reviewed`, `effective`, `superseded`).
- `RuleSource`: `document` (norma, artigo ou item), `url` (https) e `consultedAt` (data ISO).

### Operações (funções puras)
- `createRule(input)`: rejeita regra sem fonte completa, `fromYear` > `toYear`, versão < 1, ano que não tenha quatro dígitos ou `url` que não seja https.
- `createCatalog(rules)`: rejeita duas regras com o mesmo `id` e `version`. Várias versões do mesmo `id` são permitidas.
- `ruleFor(catalog, id, year)`: devolve a regra de status `effective` do `id` cuja vigência cobre o ano-calendário. Sem regra, devolve `undefined`. Se houver mais de uma `effective` cobrindo o ano, rejeita com erro de ambiguidade.
- `RuleRef`: `{ id, version }`, usado por resultados para listar as regras aplicadas (RNF-021). `refOf(rule)` o produz.
- Regras `draft`, `reviewed` e `superseded` nunca são devolvidas por `ruleFor`; reprocessar um ano antigo usa as versões que eram vigentes para ele (RNF-023).

## Critérios de aceite
- [x] CA-1: `createRule` aceita regra completa e rejeita fonte incompleta, `url` não https, vigência invertida e versão < 1.
- [x] CA-2: `createCatalog` rejeita `id` + `version` duplicados e aceita versões diferentes do mesmo `id`.
- [x] CA-3: `ruleFor` respeita o limite inferior e superior da vigência (inclusive) e vigência aberta (`toYear` ausente).
- [x] CA-4: `ruleFor` nunca devolve regra que não seja `effective` e falha de forma explícita em caso de duas `effective` para o mesmo ano.
- [x] CA-5: duas versões do mesmo `id` com vigências diferentes devolvem a versão correta para cada ano.
- [x] CA-6: `refOf` devolve `{ id, version }` e a regra original não é alterada por nenhuma operação (imutável).
- [x] CA-7: o pacote continua puro, sem dependências de runtime (ADR-0001).

## Regras fiscais envolvidas
Nenhuma. O modelo não contém valores. Os testes usam regras **fictícias** com ids claramente de teste (ex.: `teste.regra`), nunca valores que se pareçam com os reais.

## Dados e contratos
Tipos exportados por `tax-rules`. Sem contrato HTTP nem armazenamento nesta fatia.

## Segurança e privacidade
Sem dados pessoais. Mensagens de erro citam apenas `id` e versão da regra.

## Plano de testes
- Vitest: unidade para cada operação e erro.
- fast-check: propriedade de que `ruleFor` só devolve regra `effective` cuja vigência cobre o ano pedido.

## Riscos e perguntas abertas
- Decidido: `value` fica opaco até a primeira família de regras; tipar quando a tabela progressiva tiver spec.
- Decidido: o catálogo vive em arquivos JSON de dados, validados por `createRule` nos testes e revisados por PR, para que cada mudança tenha diff e fonte.
- TODO(fonte): ao entrar a primeira família de regras, a SPEC correspondente cita a norma da Receita Federal e só é aprovada com a fonte.
