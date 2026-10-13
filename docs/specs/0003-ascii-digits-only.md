# SPEC-0003: Apenas dígitos ASCII na normalização do robô

- Status: rascunho
- Requisitos: RF-041, RNF-020; validações V-001 e V-002 de `docs/domain/validations-catalog.md`
- Fase do roadmap: 1 (MVP), correção sobre a SPEC-0001

## Problema
O robô de extração normaliza texto vindo de documentos antes de qualquer validação. Hoje `normalize_digits` usa `str.isdigit()` e `normalize_amount_br` usa `\d` em expressão regular, ambos aceitando dígitos Unicode não ASCII:

- `normalize_digits("²")` devolve `"²"` e `normalize_digits("١٢٣")` devolve `"١٢٣"`.
- `normalize_amount_br("１２,３４")` (algarismos de largura total) devolve `Decimal("12.34")`.

Isso deixa passar para a validação (e para valores fiscais) texto que não é um número no formato esperado, o que contraria o princípio de que a normalização deve ser estrita e rastreável. O `tax-core` (TypeScript) já rejeita esses caracteres (`invalid_characters`), então os dois lados divergem.

## Fora de escopo
- Conversão de algarismos de outros sistemas numéricos para ASCII (transliteração). Proposta: não converter, rejeitar.
- Qualquer mudança em `tax-core` ou na API, que já se comportam como descrito aqui.

## Comportamento
- `normalize_digits(text)` devolve apenas os caracteres `0`-`9` presentes em `text`; qualquer outro caractere, inclusive dígitos Unicode não ASCII, é descartado.
- `normalize_amount_br(text)` só aceita algarismos `0`-`9`. Texto com algarismos não ASCII levanta `InvalidAmountError`.
- Os demais comportamentos da SPEC-0001 não mudam.

## Critérios de aceite
- [ ] CA-1: `normalize_digits("²")` e `normalize_digits("١٢٣")` devolvem `""`.
- [ ] CA-2: `normalize_digits("529.982.247-25")` continua devolvendo `"52998224725"`.
- [ ] CA-3: `normalize_amount_br("１２,３４")` e `normalize_amount_br("١٢,٣٤")` levantam `InvalidAmountError`.
- [ ] CA-4: os testes existentes de `normalize_amount_br` continuam passando.
- [ ] CA-5: o teste `xfail` de `test_normalize_digits_rejects_non_ascii_digits` passa a ser um teste normal (sem `xfail`).

## Regras fiscais envolvidas
Nenhuma regra de imposto.

## Dados e contratos
Sem mudança de contrato. Mudança restrita ao módulo `extraction.normalize`.

## Segurança e privacidade
Reduz a superfície de entrada inesperada em campos de CPF/CNPJ e valores. Testes usam apenas dados fictícios.

## Plano de testes
- pytest: casos de CA-1 a CA-3 e remoção do `xfail`.
- Hypothesis: o resultado de `normalize_digits` contém apenas `0`-`9` para qualquer texto Unicode (hoje a propriedade cobre só ASCII imprimível).

## Riscos e perguntas abertas
- TODO(pergunta): documentos reais podem trazer algarismos de largura total (ex.: PDFs de origem asiática)? Proposta: não suportar no MVP; rejeitar com erro claro.
