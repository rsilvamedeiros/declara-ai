# SPEC-0008: Acesso autenticado e API HTTP de dados fiscais

- Status: aprovada
- Requisitos: RF-004, RF-012, RNF-002, RNF-003, RNF-004, RNF-007, RNF-012
- Fase do roadmap: 1 (MVP), sétima fatia

## Problema
O serviço `tax-data` (SPEC-0007) recebe um `ownerId` já autenticado, mas nada o produz e nada o expõe. Esta fatia cria a fronteira de acesso: identificar quem chama, derivar o `ownerId` e expor os casos de uso por HTTP, sem nunca aceitar `ownerId` vindo do cliente. A escolha do provedor de identidade (ADR-0007) fica atrás de uma porta, para não travar a fatia.

## Fora de escopo
- Escolha, configuração e integração com um provedor OIDC real (depende de custo e residência de dados; decisão do dono).
- Cadastro, recuperação de senha e MFA: ficam no provedor (ADR-0007).
- Banco de dados e RLS; módulo `people` (RF-010 e RF-011); compartilhamento entre membros da família.
- Upload de documentos e criação de campos `extracted`.
- Front-end.

## Comportamento

### Identidade (porta `TokenVerifier`)
- Interface do módulo `identity`: `verify(bearerToken)` devolve `{ ownerId }` ou falha. O adaptador resolve o `subject` do provedor para o `ownerId` interno por uma tabela de contas (cada conta é um espaço isolado).
- Adaptador de teste com tokens fictícios; o adaptador OIDC real entra em spec própria.
- Guard HTTP: exige `Authorization: Bearer <token>`; sem token, token inválido ou expirado resulta em `401`, com a mesma resposta e sem detalhe do motivo. O `ownerId` fica na requisição e é a única origem do dono: corpo, query e path nunca o definem.

### Endpoints de dados fiscais (módulo `tax-data`)
Todos exigem autenticação e usam o `ownerId` do guard:
- `POST /fields` cria campo manual (`personId`, `year`, `key`, `value`).
- `GET /people/{personId}/years/{year}/fields` lista os campos, incluindo rejeitados.
- `POST /fields/{id}/confirm`, `POST /fields/{id}/correct` (novo valor), `POST /fields/{id}/reject`.
- `GET /people/{personId}/years/{year}/alerts` devolve os alertas V-011.
- Valores monetários trafegam como string decimal (`"1234.56"`), nunca como número de ponto flutuante.

### Erros HTTP
`not_found` vira `404` (inclusive id de outro dono), `invalid_transition` e `ambiguous_value` viram `409`, entrada inválida (ano, valor, corpo) vira `400`, sem token válido `401`. O corpo do erro traz só um código estável, sem valor, trecho ou CPF.

## Critérios de aceite
- [ ] CA-1: requisição sem token, com token inválido ou expirado recebe `401` idêntico e não chega ao serviço.
- [ ] CA-2: o `ownerId` vem só do token verificado; enviar `ownerId` no corpo, query ou path não muda o dono.
- [ ] CA-3: um usuário recebe `404` ao confirmar, corrigir, rejeitar ou ler campo de outro, e a listagem dele não inclui campos alheios.
- [ ] CA-4: cada endpoint aciona o caso de uso correspondente e devolve o campo com `id`, status e valor em string decimal.
- [ ] CA-5: transição inválida e ambiguidade resultam em `409` sem alterar o armazenado.
- [ ] CA-6: entrada malformada resulta em `400`; nenhuma resposta de erro nem log carrega valor, trecho ou CPF.
- [ ] CA-7: o contrato OpenAPI descreve os endpoints e é validado contra as respostas nos testes.
- [ ] CA-8: o módulo `identity` só depende de `@declara/tax-core` e `@nestjs/common`; `tax-data` usa `identity` só pela interface pública.

## Regras fiscais envolvidas
Nenhuma.

## Dados e contratos
Interface `TokenVerifier` e decorador/guard de autenticação exportados por `identity`. Contrato OpenAPI em `packages/contracts` (a estrutura do pacote já existe no monorepo).

## Segurança e privacidade
- O isolamento (RNF-002) é aplicado em dois pontos: `ownerId` só do token, e porta de armazenamento restrita ao dono.
- Respostas `401` e `404` não revelam se o recurso ou a conta existem.
- Sem dados reais nos testes; tokens de teste são fictícios e não servem em produção.
- Impacto no modelo de ameaças: define a fronteira de autenticação; limitação de tentativas e alerta de login novo ficam com o provedor e entram na spec do adaptador OIDC.

## Plano de testes
- Vitest com Nest e supertest: guard (CA-1, CA-2), isolamento entre dois usuários (CA-3), cada endpoint (CA-4, CA-5), validação de entrada (CA-6).
- Validação das respostas contra o OpenAPI (CA-7).
- Teste de arquitetura de imports (CA-8), no mesmo estilo do módulo `tax-data`.

## Riscos e perguntas abertas
- Decidido: tabela própria de contas mapeando o `subject` do provedor para o `ownerId`, para trocar de provedor sem migrar ids dos dados. A tabela entra com o adaptador de armazenamento; nesta fatia, a porta `TokenVerifier` já devolve o `ownerId` resolvido.
- Decidido: `POST /fields/{id}/correct` exige o mesmo tipo do campo; mudar de dinheiro para texto (ou o inverso) resulta em `400`.
- Decidido: sem paginação nesta fatia (volume pequeno por pessoa e ano).
