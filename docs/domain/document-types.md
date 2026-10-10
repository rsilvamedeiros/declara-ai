# Tipos de documento

Status: rascunho. Campos são os esperados; o layout real varia por emissor e deve ser levantado com amostras reais (sem dados pessoais no repositório).

Para cada campo extraído guardamos: valor, documento, página, trecho, confiança e se foi confirmado pelo usuário.

| Tipo | Origem | Campos principais esperados | Ficha provável | Fase |
|---|---|---|---|---|
| Informe de rendimentos do empregador | Fonte pagadora | CNPJ e nome da fonte, CPF do beneficiário, rendimentos tributáveis, contribuição previdenciária, imposto retido, 13º, isentos | Rendimentos tributáveis; imposto retido | 1 |
| Recibo de despesa médica | Profissional/clínica | CPF/CNPJ do prestador, nome, valor, data, beneficiário, descrição | Pagamentos efetuados | 1 |
| Informe de banco/instituição financeira | Banco | Saldos, rendimentos, imposto retido | Bens e direitos; rendimentos | 2 |
| Comprovante de educação | Instituição de ensino | CNPJ, aluno, valor pago no ano | Pagamentos efetuados | 2 |
| Declaração do ano anterior | Receita/usuário | Bens, dívidas, dependentes, saldos | Várias | 2 |
| Informe de corretora | Corretora | Posições, rendimentos, imposto retido | Bens e direitos; rendimentos | 3 |
| Nota de corretagem | Corretora | Operações, custos, data | Renda variável | 3 |
| DARF | Contribuinte | Código de receita, período, valor, data de pagamento | Imposto pago | 3 |
| Comprovante de carnê-leão | Contribuinte | Período, valor | Imposto pago | 3 |

## Regras de ingestão

- Aceitar formatos comuns (PDF com texto, imagem, PDF digitalizado); o limite exato será definido na arquitetura.
- Todo documento recebe um identificador, hash do conteúdo e metadados (pessoa, ano-calendário, tipo, data de envio).
- Documento duplicado (mesmo hash) é detectado e avisado.
- Documento ilegível ou de tipo desconhecido vai para revisão manual; nunca é descartado em silêncio.
- A classificação do tipo e a extração sugeridas por IA exigem confirmação do usuário.

## Perguntas abertas

- TODO(pergunta): quais emissores concentram os documentos dos primeiros usuários (para priorizar layouts)?
