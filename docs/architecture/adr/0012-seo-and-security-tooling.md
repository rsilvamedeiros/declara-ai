# ADR-0012: Scripts de SEO e vulnerabilidade (backlog)

- Status: proposta (geração adiada, por decisão do produto)
- Data: 2026-10-10

## Contexto
O produto quer scripts de SEO e de varredura de vulnerabilidades, a serem gerados depois. Aqui fica apenas o inventário.

## Candidatos (open source)
**SEO e qualidade da área pública**
- Lighthouse CI (desempenho, SEO, acessibilidade, boas práticas)
- Verificação de sitemap, robots, metadados e links quebrados
- axe (acessibilidade) no Cypress

**Vulnerabilidade**
- Dependências: `npm audit`, `pip-audit`, OSV-Scanner
- Segredos: gitleaks
- Código (SAST): Semgrep
- Contêineres e IaC: Trivy
- DAST: OWASP ZAP baseline contra homologação
- Dependabot ou Renovate para atualização

## Decisão
Nada é gerado agora. Quando for, entra por especificação (SDD), rodando em CI. O alvo mínimo antes do lançamento: dependências, segredos, SAST e ZAP em homologação.
