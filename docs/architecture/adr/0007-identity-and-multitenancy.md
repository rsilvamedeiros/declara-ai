# ADR-0007: Identidade, autenticação e multi-tenant

- Status: proposta
- Data: 2026-10-10

## Contexto
Produto para terceiros; um usuário pode gerenciar várias pessoas (titular, cônjuge, dependentes); acesso compartilhado entre membros da família pode vir depois.

## Opções
1. **Provedor de identidade gerenciado (OIDC)**. Prós: segurança madura (MFA, recuperação), menos código crítico. Contras: dependência e custo.
2. **Autenticação própria**. Contras: risco e esforço altos para um item crítico.

## Decisão (proposta)
Opção 1, com MFA disponível. Modelo de tenant: cada conta é um espaço isolado; pessoas são entidades dentro da conta. Autorização no backend e RLS no banco; nada de confiar no front.

## Consequências
Menos superfície de ataque própria. Escolha do provedor depende de custo e residência de dados.
