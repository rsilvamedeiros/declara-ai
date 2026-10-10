# Catálogo de validações e alertas

Status: rascunho. Cada validação é código determinístico. As que dependem de regra fiscal referenciam o id da regra no catálogo.

## Severidades

- **Erro**: impede o roteiro final até ser corrigido ou justificado.
- **Alerta**: risco real de malha fina ou perda de dedução.
- **Aviso**: informação útil ou possível melhoria.

## Validações previstas

| id | Validação | Severidade | Depende de regra | Fase |
|---|---|---|---|---|
| V-001 | CPF válido (dígitos verificadores) | Erro | Não | 1 |
| V-002 | CNPJ válido (dígitos verificadores) | Erro | Não | 1 |
| V-003 | Recibo médico incompleto (sem CPF/CNPJ, valor ou data) | Alerta | Sim (requisitos do recibo) | 1 |
| V-004 | Dedução acima do limite do ano | Alerta | Sim | 1 |
| V-005 | Soma de campos incoerente com o total do documento | Alerta | Não | 1 |
| V-006 | Documento esperado ausente | Aviso | Parcial | 1 |
| V-007 | Documento duplicado | Aviso | Não | 1 |
| V-008 | Dependente declarado mais de uma vez | Erro | Sim | 2 |
| V-009 | Divergência de saldo entre anos | Alerta | Não | 2 |
| V-010 | Rendimento que exigia carnê-leão sem recolhimento | Alerta | Sim | 3 |
| V-011 | Divergência entre valor extraído e valor informado manualmente | Alerta | Não | 1 |
| V-012 | Extração com baixa confiança sem confirmação | Aviso | Não | 1 |

## Estrutura de um alerta

- id da validação, severidade e mensagem em linguagem simples;
- campos e documentos envolvidos (rastreabilidade);
- id e versão da regra usada, com fonte;
- ação sugerida (corrigir, anexar documento, justificar);
- estado: aberto, resolvido, justificado pelo usuário.

## Princípios

- Uma validação não corrige valores sozinha; só sinaliza e sugere.
- Falso positivo é preferível a omissão em risco de malha fina, mas deve ser dispensável com justificativa registrada.
- Cada validação nasce de teste escrito antes (TDD) com casos válidos e inválidos.

TODO(fonte): confirmar requisitos oficiais de recibo e limites antes de implementar V-003, V-004 e V-010.
