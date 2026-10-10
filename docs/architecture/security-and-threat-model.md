# Segurança e modelo de ameaças

Status: rascunho. Metodologia sugerida: STRIDE por fluxo, revisado antes de cada fase.

## Ativos

Documentos fiscais, dados extraídos, CPF e dados de dependentes, credenciais, chaves de cifragem, catálogo de regras (integridade).

## Fronteiras de confiança

Navegador do usuário, API, workers de processamento, banco, armazenamento de objetos, provedor de IA, equipe interna.

## Ameaças principais e controles

| Ameaça | Controle previsto |
|---|---|
| Acesso a dados de outro usuário | Autorização no backend em toda rota, RLS no banco, testes de isolamento |
| Roubo de conta | MFA, limitação de tentativas, alerta de login novo |
| Arquivo malicioso enviado | Validação de tipo/tamanho, antivírus, processamento em contêiner isolado e sem rede ampla |
| Injeção em prompt via conteúdo do documento | IA sem ferramentas nem acesso a dados; saída tratada como não confiável e validada por esquema |
| Vazamento por IA externa | Minimização/anonimização, gateway, contrato sem treinamento, log sem conteúdo |
| Vazamento em logs | Política de log sem dados pessoais, revisão automática |
| Exposição de documentos | Cifragem em repouso, URLs assinadas curtas, nada público |
| Adulteração de regra fiscal | Catálogo versionado, revisão obrigatória, testes com casos oficiais |
| Acesso indevido interno | Menor privilégio, acesso auditado, sem acesso de suporte a documentos sem justificativa registrada |
| Perda de dados | Backup cifrado, restauração testada |
| Dependências vulneráveis | Varredura de dependências e segredos em CI |

## Criptografia

Em trânsito: TLS. Em repouso: cifragem do banco e do armazenamento. Avaliar cifragem por usuário para documentos. TODO(pergunta): nível de cifragem por usuário versus custo de recuperação de conta.

## Requisitos de processo

Revisão de segurança por especificação, varredura de segredos, plano de resposta a incidentes (ver `docs/requirements/compliance-lgpd.md`).
