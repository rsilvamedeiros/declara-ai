# ADR-0008: Hospedagem e infraestrutura

- Status: aceita (aprovada em bloco, 2026-10-13); escolha do provedor de nuvem e orçamento seguem em aberto
- Data: 2026-10-10

## Contexto
Dados de brasileiros; sensibilidade a transferência internacional; pico sazonal; equipe pequena.

## Opções
1. **Nuvem pública com região no Brasil, serviços gerenciados e infraestrutura como código**. Prós: elasticidade, menos operação. Contras: custo variável.
2. **Servidores próprios/VPS**. Contras: mais operação e risco.

## Decisão (proposta)
Opção 1: região no Brasil para dados e documentos, infraestrutura como código, ambientes separados (dev, homologação, produção), CI/CD com checagens obrigatórias, backups cifrados com restauração testada e observabilidade sem dados pessoais. Escolha do provedor adiada: TODO(pergunta) orçamento e preferência.

## Consequências
Elasticidade no pico. Exige controle de custo e gestão de acessos.
