# Estratégia de IA

Status: rascunho

## Princípio

Robô determinístico primeiro; IA para o resíduo; humano confirma. IA nunca calcula imposto nem decide valor fiscal sozinha.

## O que a IA pode fazer

- Sugerir o tipo do documento e a ficha correspondente.
- Extrair campos de layouts que os parsers determinísticos não cobrem.
- Explicar regras em linguagem simples, a partir do catálogo (conteúdo pré-aprovado ou texto gerado a partir da regra e revisado).
- Triar normas novas e sugerir impacto, sempre com revisão humana.

## O que a IA não faz

- Definir valores de regra fiscal.
- Calcular imposto ou validar limites.
- Confirmar campos no lugar do usuário.

## Salvaguardas

1. **Esquema estrito de saída**, validado; saída fora do esquema é descartada.
2. **Conferência determinística**: formato (CPF/CNPJ), somas, intervalos.
3. **Rastreabilidade**: página e trecho de cada campo, versão do robô e do modelo.
4. **Confiança e revisão**: baixa confiança exige confirmação explícita.
5. **Minimização e anonimização** antes de enviar a provedores; gateway interno.
6. **Sem ferramentas ou acesso a dados** para o modelo de extração, contra injeção de prompt.

## Avaliação

- Conjunto de documentos sintéticos ou anonimizados por tipo e emissor.
- Métricas por campo: acerto, omissão, erro grave (valor errado com confiança alta).
- Critério de liberação: erro grave abaixo de um limite a definir. TODO(pergunta).
- Teste de regressão a cada troca de modelo, prompt ou robô.

## Custos e limites

TODO(pergunta): orçamento por documento e política de limites por usuário.
