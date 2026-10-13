# packages/contracts

Contratos entre partes do sistema:

- OpenAPI da API (consumido pelo Nuxt para gerar o cliente).
- JSON Schema das mensagens de tarefa e resultado entre a API e os robôs Python.

Mudanças de contrato são versionadas e testadas dos dois lados.

## Arquivos

- `openapi.json`: contrato dos endpoints de dados fiscais (SPEC-0008). Os testes da API conferem rotas e formato das respostas contra ele.
