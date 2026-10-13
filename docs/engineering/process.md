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

## Revisão por Pull Request

- Toda mudança entra por PR a partir de uma branch `tipo/nome-curto`; push direto na `main` não é usado.
- O autor revisa o próprio diff antes de abrir o PR, inclusive o gerado por IA.
- O CI (formatação, lint, tipos, testes) precisa estar verde.
- Revisão do dono do projeto antes do merge. Mudanças de regra fiscal, autenticação, armazenamento ou envio a IA recebem checagem explícita de fonte oficial, segurança e privacidade.
- Um PR por assunto. Especificação (SDD) e implementação podem ir em PRs separados quando a especificação precisar de aprovação antes.
- A IA pode revisar o PR como apoio, mas a aprovação é humana.

## Uso de IA no desenvolvimento

- A IA acelera; a responsabilidade é de quem commita.
- Código gerado segue o mesmo processo: especificação, teste primeiro, revisão.
- Nenhum dado real, segredo ou documento de usuário em prompts de desenvolvimento.
- Fonte oficial é consultada para regra fiscal; a IA não é fonte.

## Commits e branches

Ver `CLAUDE.md`: Conventional Commits em inglês, só assunto; branches `tipo/nome-curto`; mudanças entram por Pull Request.

## Decisões técnicas

Registradas em ADRs (`docs/architecture/adr/`). Mudança de decisão gera novo ADR que substitui o anterior.
