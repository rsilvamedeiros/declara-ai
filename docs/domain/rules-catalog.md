# Catálogo de regras fiscais

Status: rascunho (modelo do catálogo, sem valores)

Toda regra fiscal usada pelo sistema vem deste catálogo. Código nunca embute constante fiscal fora dele.

## Princípios

1. **Fonte oficial obrigatória.** Sem fonte, a regra não entra.
2. **Vigência explícita.** Cada regra tem ano-calendário (ou intervalo) de aplicação.
3. **Versionada e imutável.** Correções geram nova versão; a anterior fica no histórico.
4. **Revisão humana.** Alteração de regra exige revisão e testes com casos da fonte oficial.
5. **Rastreável.** Todo resultado calculado lista as regras (id e versão) que usou.

## Modelo de uma regra

| Campo | Descrição |
|---|---|
| id | Identificador estável (ex.: `deducao.dependente`) |
| titulo | Nome legível |
| descricao | O que a regra faz, em linguagem simples (alimenta a área educativa) |
| ano_calendario_inicio / fim | Vigência |
| tipo | tabela, limite, alíquota, condição, prazo |
| valor | Conteúdo estruturado da regra |
| fonte | Documento oficial (norma, artigo/item), URL e data de consulta |
| versao | Número da versão |
| status | rascunho, revisada, vigente, substituída |
| revisor / data_revisao | Quem validou e quando |
| casos_de_teste | Exemplos tirados da fonte oficial |

## Famílias de regras previstas

- Tabela progressiva (mensal e anual) e parcela a deduzir
- Desconto simplificado
- Deduções: dependentes, instrução, saúde, previdência, pensão alimentícia
- Limites e condições de cada dedução
- Obrigatoriedade de declarar
- Carnê-leão: condições e prazos
- Tratamento de renda variável e ganhos de capital (fase posterior)
- Prazos de entrega e multas

## Processo de atualização

1. Detectar nova norma ou alteração na fonte oficial.
2. Registrar a mudança e o impacto estimado.
3. Redigir a nova versão da regra com a fonte.
4. Escrever primeiro o teste com o caso oficial (TDD).
5. Revisar e publicar.

TODO(fonte): preencher o catálogo do ano-calendário corrente com valores confirmados nas fontes oficiais.
