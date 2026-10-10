# ADR-0004: Banco de dados e armazenamento de documentos

- Status: proposta
- Data: 2026-10-10

## Contexto
Dados relacionais fortes (pessoa, ano, documento, campo, origem), necessidade de integridade, auditoria e isolamento por usuário. Documentos binários sensíveis.

## Opções
1. **PostgreSQL** para dados + **armazenamento de objetos cifrado** para documentos. Prós: integridade, JSON quando útil, segurança em nível de linha (RLS), maturidade. Contras: operação.
2. **NoSQL de documentos**. Contras: integridade relacional e consultas fiscais mais frágeis.

## Decisão (proposta)
Opção 1. Isolamento por usuário reforçado também no banco (RLS). Documentos em armazenamento de objetos com cifragem em repouso, chaves gerenciadas e acesso apenas por URLs assinadas e de curta duração. Catálogo de regras versionado como dados + testes.

## Consequências
Modelo claro para rastreabilidade. Exige rotina de backup, restauração testada e gestão de chaves.
