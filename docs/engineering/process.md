# Processo de engenharia

Status: rascunho

## Fluxo de uma funcionalidade (SDD + TDD)

1. **Especificação** em `docs/specs/NNNN-nome.md` (template em `specs/0000-template.md`): problema, requisitos (ids de `docs/requirements/`), critérios de aceite, regras fiscais usadas, riscos de segurança e privacidade.
2. **Aprovação** da especificação antes de qualquer código.
3. **Testes primeiro**: cada critério de aceite vira teste que falha.
4. **Implementação mínima** que faz o teste passar.
5. **Refatoração** com testes verdes.
6. **Revisão** do diff (ver abaixo) e commit.

## Definição de pronto

- Critérios de aceite cobertos por testes automatizados passando.
- Checagens de CI verdes: formatação, lint, tipos, testes, varredura de dependências e segredos.
- Regras fiscais com fonte oficial e caso de teste da fonte.
- Sem dado pessoal em log, teste ou repositório.
- Documentação e ADR atualizados quando houver decisão nova.

## Revisão sem PR

Sem Pull Requests por ora, mas a revisão continua obrigatória:

- Antes do commit, ler o diff completo, inclusive o gerado por IA.
- Checar: correção, testes, segurança/privacidade, fronteiras de módulo, simplicidade.
- Mudanças de regra fiscal, autenticação, armazenamento ou envio a IA recebem revisão explícita adicional e registro na especificação.
- Reavaliar este item quando houver mais de uma pessoa ou na Fase 2 do roadmap.

## Uso de IA no desenvolvimento

- A IA acelera; a responsabilidade é de quem commita.
- Código gerado segue o mesmo processo: especificação, teste primeiro, revisão.
- Nenhum dado real, segredo ou documento de usuário em prompts de desenvolvimento.
- Fonte oficial é consultada para regra fiscal; a IA não é fonte.

## Commits e branches

Ver `CLAUDE.md`: Conventional Commits em inglês, só assunto; branches `tipo/nome-curto`; por ora push direto na `main`.

## Decisões técnicas

Registradas em ADRs (`docs/architecture/adr/`). Mudança de decisão gera novo ADR que substitui o anterior.
