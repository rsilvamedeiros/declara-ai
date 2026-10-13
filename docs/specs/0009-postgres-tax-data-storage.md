# SPEC-0009: Armazenamento dos dados fiscais em PostgreSQL

- Status: implementada
- Requisitos: RNF-001, RNF-002, RNF-004, RNF-007, RF-023, RF-030
- Fase do roadmap: 1 (MVP), oitava fatia

## Problema
Os campos fiscais rastreáveis hoje vivem só em memória (`InMemoryTaxDataRepository`). Para guardar dados de verdade é preciso o adaptador de PostgreSQL decidido no ADR-0004, com o isolamento por usuário reforçado também no banco (RLS), como o ADR-0007 pede. Esta fatia entrega o esquema, as migrações e um `PostgresTaxDataRepository` que cumpre o mesmo contrato do adaptador em memória.

## Fora de escopo
- Escolha do provedor de nuvem, região e backups (ADR-0008, em aberto); aqui só o PostgreSQL em si, local e no CI.
- Armazenamento de documentos em objetos cifrados (spec própria).
- Tabela de contas e adaptador OIDC (spec própria).
- Trilha de auditoria persistida (`AuditSink` continua uma porta; adaptador em spec própria).
- Tabelas de pessoas, documentos e catálogo de regras.

## Comportamento

### Esquema (`tax_fields`)
Uma linha por campo: `id` (uuid gerado pelo banco), `owner_id`, `person_id`, `year`, `key`, tipo do valor e valor (`value_cents` bigint para dinheiro, `value_text` para texto; exatamente um preenchido), `previous_*` equivalentes, `status`, e a origem (`origin_kind`, `document_id`, `page`, `excerpt` ou `entered_at`). Restrições `CHECK` espelham as regras de `tax-core` (status válido, ano de 4 dígitos, origem coerente com o tipo, exatamente um valor). Índice por `(owner_id, person_id, year)`.

### Isolamento (RLS)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`, com política `owner_id = current_setting('app.owner_id')`.
- O adaptador abre uma transação por operação e define `SET LOCAL app.owner_id` antes de qualquer consulta; além disso, todas as consultas também filtram por `owner_id` (defesa em profundidade).
- A aplicação conecta com um papel sem `BYPASSRLS` e sem ser dono da tabela.
- Sem `app.owner_id` definido, nenhuma linha é visível nem gravável.

### Adaptador (`PostgresTaxDataRepository`)
Implementa `TaxDataRepository` (SPEC-0007): `add`, `get`, `list`, `replace`, com `id` gerado pelo banco. Dinheiro é gravado em centavos inteiros e reconstruído sem ponto flutuante. O repositório passa no mesmo teste de contrato do adaptador em memória.

### Migrações
Arquivos SQL numerados e versionados em `apps/api`, aplicados em ordem por um executor mínimo, com registro das migrações aplicadas. Migração já publicada nunca é editada.

## Critérios de aceite
- [x] CA-1: o `PostgresTaxDataRepository` passa o teste de contrato `repositoryContract` sem alterações no contrato.
- [x] CA-2: dinheiro e texto fazem ida e volta sem perda (incluindo valores negativos e acima de 2^53 centavos).
- [x] CA-3: com a conexão da aplicação, uma consulta SQL direta sem `app.owner_id` não devolve linhas, e com o dono A não devolve linhas do dono B (RLS testada no banco, independente do filtro do adaptador).
- [x] CA-4: `INSERT` com `owner_id` diferente do `app.owner_id` é recusado pelo banco.
- [x] CA-5: as restrições `CHECK` recusam status inválido, ano inválido, valor duplo ou ausente e origem incoerente.
- [x] CA-6: as migrações aplicam do zero e em ordem, e reaplicar não duplica nada.
- [x] CA-7: erros do adaptador e logs não carregam valor, trecho nem CPF.
- [x] CA-8: o CI roda os testes de banco contra um PostgreSQL real (serviço do workflow), e os testes unitários sem banco continuam rodando sozinhos.

## Regras fiscais envolvidas
Nenhuma.

## Dados e contratos
Esquema acima; a porta `TaxDataRepository` não muda. A string de conexão vem de variável de ambiente, nunca do repositório.

## Segurança e privacidade
- Isolamento em duas camadas: política RLS no banco e filtro por dono no adaptador (RNF-002).
- Papel da aplicação com privilégio mínimo (RNF-004): só `SELECT/INSERT/UPDATE` na tabela, sem `DELETE` nesta fatia.
- Cifragem em repouso e em trânsito é configuração do serviço gerenciado (ADR-0008); o adaptador exige TLS fora do ambiente local.
- Testes só com dados fictícios.
- Impacto no modelo de ameaças: o banco passa a ser fronteira de confiança própria.

## Plano de testes
- Contrato do repositório contra PostgreSQL real (CA-1).
- Testes SQL de RLS e `CHECK` direto no banco, com o papel da aplicação (CA-3 a CA-5).
- Teste de migrações do zero (CA-6).
- Teste de arquitetura: o adaptador fica dentro do módulo `tax-data` e só depende do driver escolhido.

## Riscos e perguntas abertas
- Decidido: driver `pg` com SQL escrito à mão e migrações em arquivos `.sql`, sem ORM nem ferramenta de migração externa. A dependência `pg` (e `@types/pg`) entra em `apps/api` com esta fatia.
- Decidido: no CI, PostgreSQL como serviço do workflow (`services: postgres`); localmente, o teste de banco é pulado quando `DATABASE_URL` não está definida, para `pnpm test` continuar rodando sem banco.
- Decidido: `DELETE` fica fora desta fatia (a exclusão de dados do usuário, RF-013, vira spec própria).
