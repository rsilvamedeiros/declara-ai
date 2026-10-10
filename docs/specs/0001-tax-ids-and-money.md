# SPEC-0001: Identificadores fiscais e valores monetários

- Status: rascunho (execução iniciada por instrução do produto; revisar)
- Requisitos: RF-041, RNF-020, RNF-021; validações V-001 e V-002 de `docs/domain/validations-catalog.md`
- Fase do roadmap: 1 (MVP), fatia inicial

## Problema
Toda a validação fiscal depende de duas bases: reconhecer CPF/CNPJ válidos e manipular dinheiro sem erro de ponto flutuante. Esta fatia também estabelece o fluxo de teste nos três runtimes (núcleo fiscal, NestJS, Python) antes de qualquer regra de imposto.

## Fora de escopo
- Qualquer regra de imposto, alíquota, limite ou arredondamento fiscal (dependem de fonte oficial, ainda não consultada).
- CNPJ alfanumérico. TODO(fonte): a Receita Federal anunciou novo formato de CNPJ com letras; confirmar norma, data de vigência e algoritmo do dígito verificador antes de suportar.
- Persistência e autenticação.

## Comportamento

### tax-core (TypeScript, `packages/tax-core`)
- `validateCpf(input)` e `validateCnpj(input)` retornam `{ valid: true, normalized }` ou `{ valid: false, reason }`.
- Aceitam entrada com ou sem máscara (pontos, traço, barra, espaços).
- `reason` ∈ `invalid_length`, `invalid_characters`, `repeated_digits`, `invalid_check_digits`.
- `Money`: valor imutável em centavos (inteiro de precisão arbitrária), criado de string decimal com ponto e no máximo duas casas (`"1234.56"`); operações `add`, `subtract`, `equals`, `compare`, `toString`. Nunca usa ponto flutuante. Multiplicação e arredondamento ficam para quando houver regra oficial.

### API NestJS (`apps/api`, módulo `validation`)
- `POST /validation/tax-id` com `{ "type": "cpf" | "cnpj", "value": string }` responde `200` com `{ valid, normalized?, reason? }` usando `tax-core`.
- Corpo inválido (tipo desconhecido, valor ausente ou não string) responde `400`.
- A API não reimplementa a lógica; apenas chama o `tax-core`.

### Robô Python (`workers/extraction`)
- `normalize_digits(text)` devolve só os dígitos de um texto.
- `normalize_amount_br(text)` converte valor no formato brasileiro (`"1.234,56"`, `"R$ 1.234,56"`, `"-1.234,56"`) em `Decimal`.
- Valor sem parte decimal com vírgula e duas casas (`"1.234"`, `"1234"`) é ambíguo e levanta `AmbiguousAmountError`. Entrada vazia ou sem número levanta `InvalidAmountError`.
- O robô **não valida CPF/CNPJ nem decide valores fiscais**: só normaliza.

## Critérios de aceite
- [ ] CA-1: CPF válido com e sem máscara é aceito; normalizado contém só 11 dígitos.
- [ ] CA-2: CPF com tamanho errado, caracteres inválidos, dígitos repetidos ou dígito verificador errado é rejeitado com o `reason` correto.
- [ ] CA-3: o mesmo para CNPJ (14 dígitos numéricos).
- [ ] CA-4: `Money` soma e subtrai exatamente (ex.: `0.10 + 0.20 = 0.30`) e rejeita formato inválido ou mais de duas casas.
- [ ] CA-5: propriedade: para qualquer par de valores, `(a + b) - b` é igual a `a`.
- [ ] CA-6: endpoint `POST /validation/tax-id` cumpre o comportamento acima, incluindo `400`.
- [ ] CA-7: `normalize_digits` e `normalize_amount_br` cumprem os casos acima, inclusive os de erro.
- [ ] CA-8: propriedade (Python): para qualquer `Decimal` com duas casas, formatar em padrão brasileiro e normalizar devolve o mesmo valor.
- [ ] CA-9: CI roda os três conjuntos de testes e bloqueia o merge se algum falhar.

## Regras fiscais envolvidas
Nenhuma regra de imposto. O algoritmo de dígito verificador de CPF/CNPJ é público e definido pela Receita Federal. TODO(fonte): citar o documento oficial do algoritmo nos testes.

## Dados e contratos
- Contrato HTTP descrito no comportamento acima; será refletido em `packages/contracts` (OpenAPI) quando o módulo evoluir.
- Nenhuma mensagem de fila nesta fatia.

## Segurança e privacidade
- Testes usam apenas CPF/CNPJ fictícios com dígitos válidos gerados para teste. Nenhum dado real no repositório.
- A API não registra o valor recebido em log (CPF/CNPJ são dados pessoais).

## Plano de testes
- Vitest: unidade em `tax-core` (casos e propriedade com fast-check).
- Vitest + `@nestjs/testing` + supertest: teste de integração HTTP do módulo `validation`.
- pytest + Hypothesis: unidade e propriedade no robô.

## Riscos e perguntas abertas
- Vitest com decorators do Nest exige plugin SWC; se houver atrito, usar Jest no Nest (ADR-0010).
- TODO(pergunta): "1.234" deve ser sempre ambíguo? Proposta: sim, por segurança.
