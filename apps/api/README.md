# apps/api

NestJS (TypeScript). Backend principal. ADRs 0001 e 0002.

## Módulos (`src/modules/`)

| Módulo | Responsabilidade |
|---|---|
| `identity` | Conta, autenticação, consentimentos |
| `people` | Titular, cônjuge, dependentes |
| `documents` | Recepção, armazenamento, hash, deduplicação |
| `extraction` | Orquestra a extração por uma interface de extrator (implementação Node primeiro; robô Python pode entrar depois) |
| `tax-data` | Dados fiscais por pessoa e ano, com origem de cada valor |
| `validation` | Executa o catálogo de validações (usa `packages/tax-core`) |
| `simulation` | Completo x simplificado e projeção (usa `packages/tax-core`) |
| `filing-guide` | Roteiro ficha a ficha e pacote de comprovantes |
| `public-content` | Dados para a área pública e simuladores abertos |
| `audit` | Trilha de acessos e alterações |
| `rule-monitoring` | Fila de normas novas e impacto (fase posterior) |
| `ai-gateway` | Único ponto de saída para IA: anonimiza, registra, troca de provedor |

## Regras de dependência

1. Fronteira entre módulos por interfaces públicas; sem acesso ao interior de outro módulo.
2. Lógica e constantes fiscais só em `packages/tax-core` e `packages/tax-rules`; módulos apenas as chamam.
3. Somente `ai-gateway` conversa com provedores de IA.
4. Violações são checadas por teste de arquitetura em CI.

Status: módulo `tax-data` implementado (SPEC-0007, sem HTTP nem banco); demais módulos aguardam SPEC aprovada.
