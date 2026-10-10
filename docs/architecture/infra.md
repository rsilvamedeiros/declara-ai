# Infraestrutura (proposta)

Status: rascunho, depende de ADR-0008.

- **Ambientes**: desenvolvimento, homologação, produção, com dados sintéticos fora de produção.
- **Infraestrutura como código** e implantação automatizada.
- **CI/CD**: formatação, lint, tipos, testes (unitários, integração, de arquitetura), varredura de dependências e segredos; bloqueio de merge se falhar. Sem PR por ora: as checagens rodam no push, e correções vêm no commit seguinte.
- **Observabilidade**: OpenTelemetry com Grafana, Loki e Prometheus (ADR-0011); logs estruturados sem dados pessoais, alertas, painel de filas.
- **Varredura de segurança e SEO**: backlog em ADR-0012.
- **Backup e recuperação**: backups cifrados, restauração testada periodicamente, metas de RPO/RTO. TODO(pergunta).
- **Escala sazonal**: capacidade elástica de workers perto do prazo de entrega.
- **Custos**: orçamento e alertas de gasto. TODO(pergunta).
