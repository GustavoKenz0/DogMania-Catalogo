# Refatoração e integração — 19/10/2026

As cinco frentes foram executadas por agentes dedicados em etapas, respeitando o
limite de três subagentes simultâneos do ambiente. Nenhum serviço remoto foi alterado.

## Resultado

- Engenharia: separação do domínio de produtos, moeda e contato; remoção do catálogo
  fixo sem consumidores e do hook de dispositivo sem chamadas. Fotos e logos originais
  preservados. Documentação de execução e configuração adicionada na raiz.
- Frontend: painel dividido em login, editor acessível e lista responsiva. Sessão,
  CRUD, disponibilidade e upload consomem Java. Removidos senha de demonstração e
  salvamento de produtos em localStorage. Erros reais permanecem visíveis no formulário.
- Backend: contrato Java/SQL corrigido, autenticação BCrypt/JWT, autorização, validações,
  limites de consultas/login, erros consistentes e upload autenticado. Segredos exigidos
  pelo ambiente; CORS restrito. Plataforma atualizada para Spring Boot 3.5.16,
  Springdoc 2.8.17 e JJWT 0.12.7.
- Banco: migration adicional preserva registros e corrige nomes/tipos. Runtime com role
  restrita, RLS e auditoria por trigger; seed sem conta compartilhada. Setup de Storage
  separado e opcional, com chaves somente no servidor.
- Testes: filtros de segurança reais nos testes HTTP, JWT, login, perfis, estoque e upload;
  contrato SQL executado em PostgreSQL WASM. Script de smoke somente local e não destrutivo.

## Evidências

- Frontend: build de cliente/SSR/Nitro e TypeScript aprovados após a atualização de dependências.
- Auditoria npm: `bun audit --json` retornou `{}` e exit code 0 após a atualização.
  Isso representa a base de avisos consultada, não uma garantia de ausência de vulnerabilidades.
- Banco: as duas migrations, o seed e `supabase/tests/access_contract.sql` passaram no
  runner PGlite 0.5.10. Não foi utilizado o banco remoto do Supabase.
- Java: resultados detalhados e limites da execução final em `tests/SECURITY_REPORT.md`.

## Antes de usar com dados reais

Configure banco e segredos conforme `README.md`, revise/aplique as migrations em
homologação, provisione o primeiro administrador e configure Storage se desejar
enviar arquivos. Se o antigo seed administrativo já foi aplicado, desative a conta
de demonstração ou troque sua senha; remover o seed do código não altera uma conta existente.

Ainda é necessário verificar a integração com o Supabase hospedado: JDBC/TLS,
políticas de Storage preexistentes, fluxo completo no navegador, backups/restauração,
monitoramento e configurações de hospedagem. O scan de dependências Maven/CVEs não
foi executado nesta etapa. Testes isolados e auditorias de pacotes não equivalem a
um pentest completo nem a uma garantia de sistema 100% seguro.
