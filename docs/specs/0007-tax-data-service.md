# SPEC-0007: Serviço de dados fiscais (casos de uso sobre o modelo rastreável)

- Status: implementada
- Requisitos: RF-023, RF-030, RF-031, RF-032, RNF-002, RNF-007, RNF-012, RNF-021
- Fase do roadmap: 1 (MVP), sexta fatia

## Problema
O modelo de dado rastreável (SPEC-0002) e os alertas (SPEC-0006) existem só como funções puras em `tax-core`. Falta a camada que os usa: registrar um dado digitado, listar os dados de uma pessoa e ano, e conduzir a revisão (confirmar, corrigir, rejeitar), sempre com isolamento entre usuários. Esta fatia cria o módulo `tax-data` da API como **casos de uso sobre uma porta de armazenamento**, sem banco, sem autenticação real e sem endpoints HTTP. Assim o isolamento fica estrutural desde o primeiro dia e a escolha de banco (ADR-0004) e de identidade (ADR-0007) entra depois, sem reescrever a regra.

## Fora de escopo
- Banco de dados, migrações e RLS (adaptador de armazenamento real, spec própria).
- Autenticação e autorização reais (módulo `identity`): aqui o chamador informa um `ownerId` já autenticado.
- Endpoints HTTP e contrato OpenAPI (spec própria, depois da identidade).
- Extração de documentos e criação de campos `extracted` (módulo `extraction`).
- Trilha de auditoria persistida (RNF-007): o serviço emite eventos por uma porta; o armazenamento da trilha fica fora.

## Comportamento

### Porta de armazenamento (`TaxDataRepository`)
Interface do módulo, com um adaptador em memória usado nos testes e no desenvolvimento. Toda operação recebe `ownerId` e só enxerga dados daquele dono:
- `add(ownerId, field)` devolve o `StoredField` (campo + `id` gerado pelo repositório);
- `get(ownerId, id)` e `list(ownerId, { personId, year })`;
- `replace(ownerId, id, field)`.
Pedir um `id` de outro dono é indistinguível de um `id` inexistente (resultado `not_found`), para não revelar a existência do dado.

### Casos de uso (`TaxDataService`)
- `enterManualField(ownerId, input)`: cria campo manual (`createManualField`) e o guarda.
- `listFields(ownerId, personId, year)`: devolve todos os campos da pessoa e do ano, em qualquer status, para a tela de revisão.
- `confirm(ownerId, id)`, `correct(ownerId, id, newValue)`, `reject(ownerId, id)`: aplicam as transições de `tax-core` e guardam o resultado; transição inválida vira erro de domínio, sem alterar o armazenado.
- `usableValue(ownerId, personId, year, key)`: usa `valueFor` e propaga o erro de ambiguidade.
- `consistencyAlerts(ownerId, personId, year)`: roda `checkExtractedVsManual` sobre os campos da pessoa e do ano.
- Cada operação que altera dado emite um evento de auditoria `{ ownerId, action, fieldId, at }` pela porta `AuditSink`, sem valor, trecho ou CPF (RNF-012).

### Erros
`not_found`, `invalid_transition` e `ambiguous_value`, todos sem dado pessoal na mensagem.

## Critérios de aceite
- [x] CA-1: `enterManualField` guarda um campo `confirmed` com origem manual e `listFields` o devolve para a mesma pessoa e ano, e só para eles.
- [x] CA-2: `confirm`, `correct` e `reject` aplicam a transição e persistem; transição inválida lança erro e deixa o armazenado intacto.
- [x] CA-3: um `ownerId` nunca lê, lista, altera nem detecta campos de outro dono (`not_found` para ids alheios).
- [x] CA-4: `usableValue` devolve só valor `confirmed`/`corrected` e propaga ambiguidade.
- [x] CA-5: `consistencyAlerts` devolve os alertas V-011 dos campos da pessoa e do ano, sem misturar donos.
- [x] CA-6: toda alteração emite exatamente um evento de auditoria sem valor, trecho nem CPF; leituras não emitem.
- [x] CA-7: o módulo só depende de `@declara/tax-core` e de `@nestjs/common` (injeção); não acessa o interior de outros módulos (README da API).

## Regras fiscais envolvidas
Nenhuma.

## Dados e contratos
Interfaces `TaxDataRepository` e `AuditSink` exportadas pelo módulo. Sem contrato HTTP nesta fatia.

## Segurança e privacidade
- O isolamento entre usuários (RNF-002) é parte da interface de armazenamento, não convenção do chamador.
- Eventos de auditoria e erros não carregam dado pessoal ou fiscal.
- Testes usam apenas dados fictícios.
- Impacto no modelo de ameaças: define o ponto onde a RLS do banco será aplicada depois; defesa em profundidade com a checagem de dono do serviço.

## Plano de testes
- Vitest sobre o serviço com o repositório em memória: cada caso de uso, isolamento entre dois donos, auditoria.
- Teste de arquitetura simples: o módulo não importa de outros módulos de `apps/api/src/modules`.
- Um teste de contrato reutilizável do `TaxDataRepository`, que o adaptador de banco futuro também deverá passar.

## Riscos e perguntas abertas
- Decidido: o `id` do campo é gerado pelo repositório, para o banco decidir.
- Decidido: `listFields` devolve também os campos `rejected`, para a tela de revisão.
- Decidido: sem endpoints HTTP nesta fatia; eles entram junto com a spec de identidade.
- Risco: o adaptador em memória não prova concorrência nem transações; o contrato de teste do repositório mitiga na troca pelo banco.
