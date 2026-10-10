# ADR-0013: Estrutura do repositório (monorepo)

- Status: proposta
- Data: 2026-10-10

## Contexto
Produto grande e em expansão, com frontend Nuxt, backend NestJS, robôs Python opcionais, núcleo fiscal compartilhado, contratos e infraestrutura. O núcleo fiscal precisa ser testável isoladamente e ter fonte única.

## Opções
1. **Monorepo** com workspaces: apps, workers, packages, infra, tools, e2e, docs. Prós: contratos e tipos compartilhados, mudanças atômicas entre front, API e núcleo fiscal, CI único. Contras: CI mais complexo com o crescimento, exige disciplina de fronteiras.
2. **Vários repositórios**. Prós: autonomia. Contras: versionamento de contratos e regra fiscal entre repositórios, mais atrito para equipe pequena.

## Decisão (proposta)
Opção 1. Gerenciador de pacotes: pnpm workspaces (TODO(pergunta): confirmar). Camadas:

- `apps/*` e `workers/*` são executáveis e dependem de `packages/*`, nunca entre si.
- `packages/tax-core` não depende de framework nem de I/O; lê regras de `packages/tax-rules`.
- `packages/contracts` é a única fonte de contratos.
- Fronteiras de módulo na API verificadas por teste de arquitetura.

Estrutura inicial no `README.md` da raiz. Quando a equipe ou o código crescer, os módulos da API podem ser extraídos para serviços sem mudar o contrato (ADR-0001).

## Consequências
Evolução coordenada e regra fiscal em um lugar. Exige ferramentas de cache de build e execução seletiva no CI à medida que o repositório cresce (TODO: avaliar Turborepo ou Nx quando houver custo mensurável).
