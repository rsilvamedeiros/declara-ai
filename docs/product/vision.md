# Visão do produto

Status: rascunho

## Problema

Declarar o IRPF todo ano é um processo manual, repetitivo e arriscado:

- documentos espalhados em e-mails, apps de banco e papel;
- retrabalho de digitar os mesmos dados a cada ano;
- risco de malha fina por erro, esquecimento ou divergência de valores;
- dificuldade de entender o que mudou nas regras de um ano para o outro.

## Proposta de valor

O declara-ai é um cofre fiscal pessoal que acompanha o contribuinte o ano todo:

1. **Guarda** os documentos fiscais, organizados por pessoa e ano-calendário.
2. **Entende** o conteúdo e classifica cada dado na ficha correspondente do IRPF, sempre rastreável até o documento de origem.
3. **Valida** e alerta sobre inconsistências antes da entrega.
4. **Ensina**: explica cada regra aplicada, com fonte oficial.
5. **Simula** o imposto (completo x simplificado) e projeta o ano em curso.
6. **Entrega** um roteiro de preenchimento ficha a ficha e um pacote de comprovantes.

O produto não substitui o programa da Receita: prepara e valida o que vai nele.

## Público

Produto para terceiros (pessoas físicas contribuintes), com suporte a titular, cônjuge e dependentes.

## Duas áreas

- **Pública**: conteúdo educativo sobre o IRPF, regras e tabelas por ano, simuladores abertos. Serve também para aquisição de usuários.
- **Logada**: cofre, extração, validação, simulação, roteiro e pacote de comprovantes.

## Modos de entrada de dados

- **Manual**: o usuário informa os dados.
- **Pré-preenchido**: os dados vêm da extração dos documentos, sempre com revisão e confirmação do usuário.

## Princípios

1. **Privacidade e segurança primeiro.** Os dados são extremamente sensíveis; é requisito central, não item de backlog.
2. **Rastreabilidade.** Todo valor aponta para o documento, página e trecho de origem.
3. **Regra fiscal com fonte oficial.** Nenhuma regra entra sem referência e vigência. Na dúvida, pergunta-se ou busca-se a fonte; nunca se supõe.
4. **Determinismo antes de IA.** Cálculo e validação são código determinístico e testado. A IA sugere (leitura, classificação, explicação); a decisão sobre valores fiscais é verificável e confirmada pelo usuário.
5. **Por ano-calendário.** Cada ano tem suas regras e seu histórico.
6. **Educar, não só automatizar.** O usuário deve entender o que está declarando.

## Fora de escopo (por enquanto)

- Transmitir a declaração.
- Gerar o arquivo oficial da declaração.
- Aconselhamento fiscal individualizado: o produto informa e valida, não substitui contador.

## Perguntas abertas

- TODO(pergunta): modelo de negócio (gratuito, assinatura, freemium)?
- TODO(pergunta): haverá perfil para contadores/terceiros que atendem vários contribuintes?
