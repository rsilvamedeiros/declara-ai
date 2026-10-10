# Estratégia de testes

Status: rascunho

Ferramentas: Cypress (E2E e componentes), Vitest (TypeScript), pytest + Hypothesis (Python), testes de contrato sobre OpenAPI. Ver ADR-0010.

## Pirâmide

| Nível | Foco | Observação |
|---|---|---|
| Unitário | Núcleo fiscal (regras, validações, cálculo), parsers, funções puras | Maioria dos testes; rápidos; sem rede nem banco |
| Integração | API com banco, armazenamento, fila | Ambiente efêmero com dados sintéticos |
| Contrato | API x frontend (OpenAPI) | Quebra de contrato falha o build |
| Arquitetura | Dependências entre módulos | O núcleo fiscal não importa IA, armazenamento nem interface |
| Ponta a ponta | Jornadas principais | Poucos, estáveis |
| Segurança | Isolamento entre usuários, autorização, upload malicioso, injeção em prompt | Rodam em CI |
| Avaliação de extração | Qualidade de robôs e IA por tipo de documento | Conjunto sintético/anonimizado; métricas por campo |

## Dados de teste

- **Nunca dados reais.** Documentos e pessoas sintéticos, com CPF/CNPJ gerados com dígitos válidos mas fictícios.
- Casos de regra fiscal vêm da fonte oficial (exemplos oficiais ou cálculos conferidos), com referência à fonte no teste.
- Cada validação tem casos válidos e inválidos, incluindo limites.

## Propriedades úteis

- Cálculo determinístico e reproduzível por ano.
- Reprocessar um ano antigo com a mesma versão de regras dá o mesmo resultado.
- Testes baseados em propriedades para validadores e somas.

## Regressão de IA

Troca de modelo, prompt ou robô exige rodar a avaliação e comparar com a linha de base. Erro grave (valor errado com confiança alta) bloqueia a troca.

## Meta de cobertura

TODO(pergunta): metas por módulo. Proposta: núcleo fiscal com cobertura de ramos muito alta e mutation testing; demais módulos com cobertura razoável focada em comportamento.
