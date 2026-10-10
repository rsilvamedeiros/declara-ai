# Conformidade e LGPD

Status: rascunho. Não é parecer jurídico. TODO(pergunta): validar com advogado especialista em proteção de dados antes do lançamento.

## Contexto

O produto trata dados pessoais e financeiros de pessoas físicas, incluindo CPF, rendimentos, bens, saúde (recibos médicos) e dados de dependentes, que podem incluir menores. Dados de saúde são dados pessoais sensíveis na LGPD (Lei nº 13.709/2018). Dados financeiros, embora não listados como sensíveis, têm alto risco e recebem o mesmo cuidado.

TODO(fonte): confirmar artigos aplicáveis no texto oficial da lei (Planalto) e orientações da ANPD.

## Papéis

- O declara-ai é, em regra, **controlador** dos dados dos usuários. Provedores de infraestrutura e IA são **operadores**. TODO(pergunta): confirmar com jurídico.

## Princípios de projeto

1. **Finalidade e minimização**: coletar só o necessário para preparar e validar a declaração.
2. **Transparência**: política de privacidade clara, incluindo o uso de IA e de operadores terceiros.
3. **Consentimento e bases legais**: definir a base legal de cada tratamento; para dados de saúde e de dependentes, tratar com especial cuidado. TODO(pergunta): bases legais por finalidade.
4. **Segurança**: medidas técnicas e administrativas (ver requisitos não funcionais).
5. **Prevenção e responsabilização**: registro das operações de tratamento, avaliação de impacto (RIPD) antes do lançamento.

## Direitos do titular (funcionalidades obrigatórias)

- Confirmação e acesso aos dados
- Correção
- Exportação (portabilidade)
- Eliminação, ressalvadas retenções legais
- Informação sobre compartilhamento (operadores, IA)
- Revogação de consentimento, quando aplicável

Mapeados em RF-013.

## Retenção

- TODO(pergunta): prazo de guarda de documentos. Há uma expectativa de guarda de comprovantes por prazo fiscal; confirmar na fonte oficial.
- Regra proposta: o usuário controla o que guarda; exclusão é possível a qualquer momento, avisando sobre prazos fiscais de guarda.

## Dependentes e menores

- O titular informa dados de terceiros (cônjuge, dependentes). TODO(pergunta): como registrar a legitimidade e o tratamento de dados de menores (melhor interesse da criança).

## Uso de IA

- Informar ao usuário quando um documento é processado por IA.
- Minimizar e anonimizar dados enviados a provedores externos; contratos com operadores devem vedar uso para treinamento. TODO(pergunta): detalhes na estratégia de IA (fase de arquitetura).
- Revisão humana sobre qualquer valor fiscal.

## Incidentes

- Plano de resposta a incidentes definido antes do lançamento.
- Comunicação à ANPD e aos titulares nos casos e prazos exigidos. TODO(fonte): confirmar prazos na regulamentação da ANPD.

## Encarregado (DPO)

- TODO(pergunta): definir o encarregado e o canal de contato com titulares.

## Dados internacionais

- Se algum operador processar dados fora do Brasil, aplicam-se as regras de transferência internacional. TODO(fonte): confirmar requisitos.

## Pendências antes do lançamento

- Política de privacidade e termos de uso
- RIPD
- Contratos com operadores
- Plano de resposta a incidentes
- Parecer jurídico
