# declara-ai

Cofre fiscal pessoal para a declaração de IRPF (Brasil).

## Objetivo

Resolver a dor anual da declaração de imposto de renda. O sistema guarda os documentos fiscais o ano todo, entende o conteúdo deles, aponta inconsistências antes da entrega e se mantém atualizado com as mudanças de regras do IRPF a cada ano.

## Problemas que resolve

- Documentos espalhados (e-mail, apps de banco, papel) na hora de declarar
- Retrabalho de digitar tudo de novo todo ano
- Risco de malha fina por erro, esquecimento ou divergência de valores
- Dificuldade de acompanhar o que mudou nas regras de um ano para o outro

## O que o produto deve fazer

1. Receber documentos: informes de rendimento (empregador, bancos, corretoras), recibos médicos e de educação, DARFs, notas de corretagem e a declaração do ano anterior
2. Extrair os dados de cada documento e classificar pela ficha correspondente do IRPF, sempre rastreável até o documento de origem
3. Validar e alertar: divergências de saldos entre anos, CPF/CNPJ inválidos, limites de dedução, rendimentos que exigiam carnê-leão, recibos incompletos
4. Aplicar as regras do ano-calendário correto (tabelas, faixas, limites), com histórico por ano
5. Acompanhar mudanças: identificar novas regras e normas da Receita e indicar o impacto na declaração
6. Simular: modelo completo x simplificado e projeção do imposto do ano em curso
7. Entregar um roteiro de preenchimento ficha a ficha e um pacote organizado de comprovantes

## Premissas

- Dados extremamente sensíveis: privacidade e segurança como requisito central
- Suporte a mais de uma pessoa (titular, cônjuge, dependentes) e a vários anos
- Toda regra fiscal precisa ter fonte oficial referenciada
- Não substitui o programa da Receita; prepara e valida o que vai nele

## Fora de escopo (por enquanto)

- Transmitir a declaração
- Gerar o arquivo oficial da declaração
- Decisões de infraestrutura e arquitetura: serão definidas depois

## Como trabalhar

### Comunicação e processo

- Comunicação direta e objetiva
- Não implementar nada sem plano aprovado
- Na dúvida sobre regra fiscal, perguntar ou buscar a fonte oficial, nunca supor

### IA como ferramenta de otimização, com engenharia disciplinada

A IA acelera o trabalho, mas não substitui as práticas de engenharia. Desde o início:

- **Arquitetura**: decisões registradas (ADRs) antes de implementar; fronteiras claras entre domínio fiscal, extração de documentos e interface
- **SDD (Spec-Driven Development)**: toda funcionalidade começa por uma especificação revisada e aprovada, antes do código
- **TDD**: teste que falha primeiro, depois a implementação mínima, depois refatoração. Regras fiscais exigem testes com casos extraídos da fonte oficial
- **Code review**: nada entra sem revisão, inclusive código gerado por IA, que deve ser lido e entendido como qualquer outro
- **Boas práticas**: mudanças pequenas e incrementais, código simples, sem dependências desnecessárias, sem segredos ou dados reais no repositório
- Saída de IA que alimenta valores fiscais deve ser rastreável e verificável (documento de origem, trecho extraído); nunca aceita sem validação determinística

### Commits

- Em inglês, no padrão Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`...)
- Objetivos e curtos, como um desenvolvedor humano escreveria
- Sem `@author` e sem corpo/description, apenas a linha de assunto

### Branches e fluxo

- Nomes de branch no padrão `tipo/nome-curto` (`feat/ingestion`, `fix/cpf-validation`, `docs/mvp-spec`...), com os mesmos tipos dos commits
- Nada vai direto na `main`: cada mudança abre um Pull Request, que o dono do projeto revisa e aprova
- PRs pequenos e focados, um assunto por PR, com o CI verde antes de pedir revisão
- O PR segue o template em `.github/pull_request_template.md`
- Mudança de regra fiscal, autenticação, armazenamento ou envio a IA precisa de atenção redobrada na revisão e cita a fonte oficial / a especificação
- Quem abre o PR (inclusive a IA) acompanha CI e comentários e corrige até ficar mergeável; o merge é do dono do projeto
- Commits seguem a seção acima: só assunto, sem trailers de autoria
