# Requisitos não funcionais

Status: rascunho. Metas numéricas ficam como TODO até definirmos arquitetura e custo.

## Segurança

- RNF-001: dados em trânsito e em repouso protegidos por criptografia.
- RNF-002: isolamento total entre usuários; nenhum dado de um usuário acessível a outro.
- RNF-003: autenticação forte (autenticação em duas etapas disponível).
- RNF-004: princípio do menor privilégio para pessoas e serviços; acesso interno aos dados é auditado.
- RNF-005: sem segredos, dados reais ou documentos reais no repositório.
- RNF-006: documentos enviados são tratados como não confiáveis (verificação de tipo e tamanho, isolamento do processamento).
- RNF-007: trilha de auditoria de acessos e alterações a dados fiscais.
- RNF-008: modelo de ameaças documentado antes da implementação.

## Privacidade

- RNF-010: coleta mínima; só o necessário para a função.
- RNF-011: dados enviados a IA externa passam por minimização/anonimização definida na estratégia de IA; o uso de IA é transparente ao usuário.
- RNF-012: logs e métricas sem dados pessoais ou fiscais.
- Detalhes em `compliance-lgpd.md`.

## Correção e confiabilidade fiscal

- RNF-020: cálculo e validação determinísticos, reproduzíveis e cobertos por testes com casos de fonte oficial.
- RNF-021: todo valor rastreável até a origem; todo resultado lista regras (id e versão) usadas.
- RNF-022: saída de IA nunca vira valor fiscal sem confirmação do usuário e validação determinística.
- RNF-023: regras versionadas por ano; reprocessar um ano antigo dá o mesmo resultado.

## Desempenho e disponibilidade

- RNF-030: TODO(pergunta) metas de tempo de resposta e de processamento de documento.
- RNF-031: TODO(pergunta) disponibilidade esperada; maior sensibilidade perto do prazo de entrega da declaração (pico sazonal).
- RNF-032: backup e recuperação testados.

## Usabilidade e acessibilidade

- RNF-040: responsivo, uso confortável no celular, inclusive para enviar fotos de documentos.
- RNF-041: acessibilidade conforme WCAG (nível a definir).
- RNF-042: linguagem simples; termos fiscais explicados no contexto.
- RNF-043: interface em português do Brasil.

## Manutenibilidade e qualidade

- RNF-050: SDD e TDD como processo padrão; revisão de código obrigatória, inclusive para código gerado por IA.
- RNF-051: decisões técnicas registradas em ADRs.
- RNF-052: observabilidade suficiente para diagnosticar falhas sem expor dados pessoais.
- RNF-053: avaliação contínua da qualidade de extração com conjunto de documentos sintéticos ou anonimizados.
