# Dogmania — contexto e histórico de alterações

Última atualização: **19/10/2026** (America/Sao_Paulo).

Este é o arquivo único de contexto e relatório contínuo solicitado pelo usuário.
Uma nova IA deve começar por ele e pelo `AGENTS.md`, depois conferir os arquivos
que irá modificar. O resumo descreve o estado conhecido; o histórico preserva
as entregas. Não deduza que uma validação antiga continua válida após novas mudanças.

## 1. Objetivo e decisões do usuário

**GitHub:** toda entrega com alterações deve ser preparada para envio, mas o
usuário exige aprovação explícita antes de cada commit e push. Apresentar conteúdo,
verificações, mensagem e destino antes de executar. Não há autorização permanente
para enviar mudanças automaticamente. Nunca incluir segredos, chaves, dumps ou
configurações locais. A regra está detalhada no `AGENTS.md`.

Destino escolhido pelo usuário: `https://github.com/GustavoKenz0/DogMania-Catalogo.git`,
remote `origin`, branch local `main`. O repositório Git foi inicializado nesta
raiz, abrangendo frontend, backend, banco e documentos. Em 19/10/2026, o usuário
aprovou o primeiro commit e push, com a mensagem “Adiciona projeto completo da
Dogmania e documentação”, para `origin/main`. Conferir o resultado e sincronização
pelo histórico Git e pelas refs remotas; a existência do remote não comprova envio.
Essa aprovação vale somente para a entrega inicial revisada. Novas entregas
continuam exigindo aprovação própria antes de commit e push.

Catálogo digital da Dogmania Pet Shop, em Maringá, com compra iniciada pelo WhatsApp.
Clientes navegam sem conta. Somente administradores fazem login e gerenciam produtos.
O painel precisa ser intuitivo para pessoas sem familiaridade com sistemas:
ações com texto, formulários claros, feedback de erros e confirmação de exclusão.

O projeto começou somente com frontend e dados locais. O usuário posteriormente
adicionou Java e Supabase e autorizou a refatoração completa e testes de segurança.
Portanto, a restrição histórica de trabalhar apenas no frontend foi superada
por esse pedido. As próximas mudanças devem respeitar o escopo solicitado em cada tarefa.

Identidade e conteúdo existentes a preservar:

- Azul e dourado da marca, logo fornecida pelo usuário e fotos reais de pets nos banners.
- Endereço: Av. Humaitá, 299, Zona 04, Maringá–PR, CEP 87014-200.
- Telefones: (44) 3225-0871 e (44) 3031-7871.
- WhatsApp solicitado: `554499865542`, usado nos links de compra.
- Instagram: `https://www.instagram.com/dogmaniamaringa/`.
- A área administrativa não tem link público no rodapé. `/dogmania-painel` é um
  atalho para `/admin`; ocultar uma URL não substitui autorização na API.

## 2. Arquitetura e pontos de entrada

Checkout local encontrado em 19/10/2026: `C:\Users\Gustavo Kenzo\Desktop\Dogmania-Catalogo`.
A pasta anterior em Downloads não existe mais. `.tools/publish-review/` contém
uma cópia de revisão, não o código fonte em uso; editar `backend-api/` e o
frontend reais na raiz.

```text
Dogmania-Catalogo/                  frontend React/TypeScript/TanStack Start
  src/routes/                      páginas e metadados do roteador
  src/features/admin/              login, painel, editor e lista de produtos
  src/features/products/model.ts   tipos e categorias
  src/features/products/whatsapp.ts mensagens e links de compra
  src/config/store.ts              número oficial de WhatsApp
  src/lib/api.ts                   HTTP, DTOs, autenticação e upload
  src/lib/currency.ts              preço em BRL
  src/hooks/useProducts.ts         consultas e sincronização do catálogo
  src/components/                 vitrine, header, footer e carrossel
backend-api/                       Java 21, Spring Boot, JPA e Spring Security
  src/main/java/com/dogmania/api/   controller, service, repository, model,
                                   dto, security, config e exception
  src/test/                        testes Java isolados
supabase/                          migrations, seed e configuração de Storage
  tests/                           contrato SQL e runner PostgreSQL WASM
tests/                             smoke HTTP local e evidências históricas
```

O navegador chama a API Java. A API acessa o PostgreSQL hospedado no Supabase por
JDBC. O frontend não recebe senha de banco nem chave `service_role`.

Rotas públicas: `/`, `/produtos`, `/produto/$id`.
Rotas administrativas: `/admin` e o atalho `/dogmania-painel`.
`src/routeTree.gen.ts` é gerado pelo TanStack; altere os arquivos de rotas, não
o arquivo gerado. Preserve o wrapper de configuração Lovable e os componentes
de tratamento de erro que continuam em uso.

## 3. Regras e contratos que atravessam as camadas

- Produto: ID UUID, nome, descrição, preço, categoria, imagem HTTPS, selo opcional
  e disponibilidade. Java/banco usam `name`; JSON usa `title`, aceita `name`
  como alias de entrada; `lib/api.ts` converte para o modelo do frontend.
- Valores monetários usam `BigDecimal` na API e `numeric(10,2)` no banco.
- Produto sem estoque (`active=false`) continua no painel, mas sai da vitrine,
  buscas, destaques, relacionados e consulta pública individual.
- Pausar estoque é reversível. Excluir é definitivo, com confirmação na interface.
- Não existe fallback para catálogo estático, CRUD em localStorage ou senha de
  demonstração. Uma falha de API deve aparecer como erro, sem sucesso fictício.
- Sessão usa Bearer JWT em `sessionStorage`, expiração e `/auth/me`. ADMIN e
  SUPER_ADMIN podem administrar. A API consulta o estado da conta em cada acesso.
- Login usa BCrypt e limite por IP. Logout remove o token no cliente; não há
  refresh token nem lista de revogação imediata de tokens individuais.
- As consultas públicas/admin têm caches distintos. BroadcastChannel e atualização
  periódica sincronizam o catálogo. O detalhe deve tratar 404 mesmo com dados em cache.
- Upload passa pela API autenticada: JPEG/PNG/WebP, até 5 MiB, assinatura inicial
  validada, nome UUID e destino Supabase Storage. Não é antivírus/transcodificação.

Base da API: `http://localhost:8080/api/v1`.

| Operação | Endpoint |
| --- | --- |
| Login e sessão | POST `/auth/login`, GET `/auth/me` |
| Catálogo público | GET `/products`, GET `/products/{id}` |
| Relacionados | GET `/products/{id}/related` |
| Lista administrativa, incluindo inativos | GET `/admin/products` |
| Cadastrar / editar / excluir | POST `/products`, PUT/DELETE `/products/{id}` |
| Estoque | PATCH `/products/{id}/availability`, corpo `{ "active": false }` |
| Foto | POST `/uploads/image`, multipart `file`, resposta `{ "url": "https://..." }` |

O contrato detalhado e os limites estão em `backend-api/README.md`.

## 4. Banco e segurança

Migrations existentes, nesta ordem:

1. `supabase/migrations/20261019_initial_schema.sql` — schema histórico.
2. `supabase/migrations/20261020000000_java_contract_and_access.sql` — alinha os
   campos ao Java, corrige roles e aplica o modelo atual de acesso. O nome da
   migration é o identificador existente; preserve a ordem, não renumere silenciosamente.

Tabelas: `products`, `admin_users`, `audit_logs`. A role de runtime `dogmania_api`
não é dona das tabelas e não possui bypass RLS. Papéis da Data API Supabase não
recebem grants nas tabelas da aplicação; o catálogo público também passa pelo Java.
Essa RLS distingue a identidade do servidor, não cada pessoa autenticada no Java.

Triggers produzem auditoria das alterações de produtos na transação. O Java não
persiste diretamente em `audit_logs`. O banco registra a identidade da conexão;
logs da aplicação complementam o administrador autenticado. Após bootstrap,
revogar INSERT em `admin_users` reduz os privilégios de runtime.

`supabase/seed.sql` contém produtos de desenvolvimento, sem administrador fixo.
`supabase/setup_storage.sql` configura opcionalmente o bucket público `product-images`.
Revisar policies antigas de Storage antes de usar o bucket com dados reais.

Nenhuma migration, credencial ou configuração foi aplicada ao Supabase remoto
durante a refatoração de 19/10/2026. Se um seed antigo com conta compartilhada já
foi aplicado, a conta deve ser desativada ou ter a senha trocada pelo responsável.

Posteriormente, o usuário criou o projeto Supabase e aplicou as duas migrations
pelo SQL Editor. Em 19/10/2026, a configuração remota foi confirmada por JDBC:
três tabelas com RLS, role restrita habilitada com SCRAM-SHA-256, conexão da role
validada com CA oficial e hostname/TLS verificados. A API iniciou, validou o schema
com Hibernate e criou o primeiro administrador. Login e listagens foram confirmados
após recarga com bootstrap desativado; sua senha foi removida do `.env.local`.

Por solicitação expressa do usuário, os acessos de operador PostgreSQL, runtime
e administrador do site estão exclusivamente em
`.private/ACESSOS_DO_SISTEMA.local.txt`. O arquivo contém senhas legíveis e
possui DACL restrita ao usuário atual e SYSTEM; isso não criptografa o conteúdo.
Não copiar valores para contexto público, logs ou mensagens. A pasta inteira
`.private/`, os envs reais e `.tools/` estão ignorados pelo Git.

## 5. Como executar e validar

Pré-requisitos: JDK 21, Maven 3.9 e Bun; banco Supabase configurado.

1. Seguir `supabase/README.md` para migrations, role de runtime e conexão TLS.
2. Configurar as variáveis de `backend-api/.env.example` na IDE/no ambiente ou
   executar `backend-api/configure-local.ps1`. O configurador lê senhas ocultas,
   gera JWT aleatório e grava `.env.local` com ACL restrita ao usuário e SYSTEM.
   Spring carrega esse arquivo opcional no diretório `backend-api/`; ambiente
   tem precedência. O exemplo e `.env` genérico não são carregados automaticamente.
   O primeiro admin usa bootstrap opt-in, depois desabilitado.
   Para um projeto novo já migrado, `setup-supabase.ps1 -PoolerHost HOST -ProjectRef REF`
   habilita a role via prompt local antes de chamar o configurador. Não repete migrations.
   O fluxo `complete-local.ps1` gera senhas e documento privado quando solicitado.
   Os assistentes obtêm o CA oficial e usam `sslrootcert` com `verify-full`.
   A instalação atual já está configurada: não repetir esses provisionamentos.
3. Em `backend-api/`: `mvn spring-boot:run` — API na porta 8080.
   No Windows, `.\start-local.ps1` encontra o Maven no PATH ou cache Wrapper;
   `-Check` valida a presença da configuração sem conectar e `-Test` roda testes
   sem exigir credenciais. Os scripts não executam migrations remotas.
4. Em `Dogmania-Catalogo/`: configurar `.env.local` a partir de `.env.example`;
   `VITE_API_URL=http://localhost:8080/api/v1` é pública, nunca colocar segredos nela.
   Executar `bun install` e `bun run dev` — site em `http://127.0.0.1:8081`.
5. Upload depende de `STORAGE_ENABLED`, `SUPABASE_URL` e
   `SUPABASE_SERVICE_ROLE_KEY`, somente no servidor. O serviço desligado retorna
   503; o editor também aceita URL HTTPS.

Verificações reproduzíveis:

| Pasta | Comando | Escopo |
| --- | --- | --- |
| `Dogmania-Catalogo/` | `bun run build` | cliente, SSR e Nitro |
| `Dogmania-Catalogo/` | `bun x tsc --noEmit` | tipos TypeScript |
| `Dogmania-Catalogo/` | `bun audit --json` | avisos npm conhecidos no momento |
| `backend-api/` | `mvn test` | testes Java, incluindo filtros de segurança reais |
| `supabase/tests/` | `bun install --frozen-lockfile`; `bun run test` | SQL em PostgreSQL WASM descartável |
| raiz | `powershell -NoProfile -File tests/security_attack_simulation.ps1 -BaseUrl http://127.0.0.1:8080/api/v1` | smoke HTTP local, sem escrita |

O runner de SQL omite as extensões opcionais históricas uuid-ossp/pgcrypto e simula
funções Supabase Auth somente para interpretar a primeira migration; a segunda
remove aquelas policies. Não valida JDBC/TLS ou Supabase hospedado.

## 6. Últimas evidências e pendências conhecidas

Última entrega de código verificada em **19/10/2026**:

- Build frontend e TypeScript aprovados; auditoria npm retornou `{}`, exit 0.
- Java: 31 testes aprovados, zero falhas/erros/ignorados, repetidos após atualizar
  Spring Boot para 3.5.16, Springdoc para 2.8.17 e JJWT para 0.12.7.
- SQL: duas migrations, seed e contrato de grants/RLS/CRUD/preços/auditoria passaram
  em PGlite 0.5.10. Não há administrador padrão criado pelo seed.
- Configuração local adicional: `mvn clean test` pelo launcher Java/Maven passou
  com 29 fontes recompiladas e 31 testes aprovados no Oracle JDK 26/Maven 3.9.16.
  Processador Lombok agora é explícito no POM (necessário no compilador instalado).
  Os scripts foram exercitados com credenciais sintéticas em pasta isolada:
  sintaxe, JWT de 48 bytes aleatórios, ACL e escape de espaços/barra aprovados.
- Smoke: URL remota recusada; conexão local indisponível contou como falha. Não
  foi executado contra uma API completa conectada ao banco hospedado.

Configuração real concluída em **19/10/2026**: API Java em 8080 conectada ao Supabase
PostgreSQL 17.11; frontend em 127.0.0.1:8081. Login ADMIN, /auth/me e listagens
administrativas com e sem busca confirmados; catálogo público, site e /admin HTTP
200, com origem CORS correta. Catálogo remoto vazio, sem seed de demonstração.
O relatório histórico de testes acima não foi reexecutado nesta configuração.
Não houve automação visual/E2E do navegador: o runtime node_repl exigido pela skill
Computer Use não estava disponível. Os resultados atuais são de JDBC e HTTP reais.
Logs e PIDs dos processos iniciados ficam em `.tools/`; não enviar essas pastas.

Ainda pendentes: homologação ponta a ponta no navegador com Java + Supabase reais,
JDBC/TLS, políticas remotas de Storage, auditoria completa de CVEs Maven,
backup/restauração e controles de hospedagem. O limitador de login é por instância;
produção precisa considerar gateway e proxies confiáveis. Não há garantia de
segurança absoluta. Resultados de testes isolados não são um pentest completo.

`REFACTOR_REPORT.md` e `tests/SECURITY_REPORT.md` são evidências históricas anteriores
à regra do arquivo único. O contexto necessário foi consolidado aqui; próximos
relatórios de alterações serão acrescentados somente neste arquivo.

## 7. Histórico contínuo

### 2026-10-19 — 001 — Consolidação da refatoração anterior

- Pedido: revisar o projeto já integrado a Java e Supabase, refatorar estrutura,
  frontend, backend, banco e testar segurança com cinco frentes de trabalho.
- Alterações: domínio de produtos separado, catálogo local e hook sem uso removidos;
  painel modular e acessível; login/CRUD/upload reais; contratos DTO/entidade/SQL
  corrigidos; segredo JWT obrigatório; CORS restrito; validação de conta inativa;
  auditoria por trigger; seed sem senha compartilhada; dependências atualizadas.
- Arquivos/áreas: `Dogmania-Catalogo/src/features/`, `src/lib/api.ts`, `src/hooks/`,
  `src/routes/`, `src/config/`, frontend `package.json`/`bun.lock`/`vite.config.ts`,
  `backend-api/src/main/`, `backend-api/src/test/`, `backend-api/pom.xml`,
  `supabase/`, `tests/` e READMEs.
- Evidência histórica: build/TypeScript, auditoria npm, 31 testes Java e contrato
  SQL aprovados conforme seção 6. Não foram reexecutados para escrever esta entrada.
- Pendências: configuração e homologação remotas listadas acima. Assets originais
  foram preservados. Nenhum serviço remoto foi alterado.

### 2026-10-19 — 002 — Arquivo único para continuidade entre IAs

- Pedido: registrar toda alteração futura em um único arquivo para permitir que
  outra IA compreenda o contexto do código sem depender do chat.
- Alterações e motivo: criado este documento com decisões, arquitetura, contratos,
  execução, evidências, limitações e histórico. `AGENTS.md` da raiz determina a
  leitura e atualização a cada entrega; o AGENTS do frontend referencia a regra.
  README da raiz aponta para o documento de continuidade.
- Arquivos: `CONTEXTO_DO_PROJETO.md`, `AGENTS.md`,
  `Dogmania-Catalogo/AGENTS.md`, `README.md`.
- Verificação: conferência das referências e conteúdo dos documentos com os caminhos,
  configuração e relatórios existentes. Build/testes não executados nesta entrega,
  pois as alterações são exclusivamente de documentação.
- Pendências: manter o resumo atualizado e acrescentar a próxima entrada ao final
  deste histórico em toda entrega futura com alterações. Nenhuma mudança de runtime.

### 2026-10-19 — 003 — Preparação do GitHub e aprovação de cada envio

- Pedido: incluir o projeto completo e documentos no GitHub, excluindo segredos;
  futuras alterações devem ser enviadas somente após aprovação de commit e push.
  O usuário indicou como destino `GustavoKenz0/DogMania-Catalogo` durante a preparação.
- Alterações e motivo: inicializado Git próprio nesta raiz, evitando a descoberta
  de um Git na pasta pessoal que fazia comandos falharem. Configurado `origin`
  para a URL indicada e branch local `main`. Reforçadas exclusões de segredos,
  chaves, dumps, configurações locais e ferramentas. Adicionados atributos de
  texto para finais de linha consistentes. Registrada a aprovação obrigatória
  nas instruções do repositório e no README. Autoria local usa e-mail no-reply.
- Arquivos: `.gitignore`, `.gitattributes`, `AGENTS.md`, `README.md`,
  `CONTEXTO_DO_PROJETO.md`; metadados locais em `.git/` não são enviados.
- Verificação: repositório remoto indicado sem refs no momento da consulta;
  conteúdo selecionado inspecionado; Gitleaks 8.30.1, obtido do release oficial
  e validado por checksum SHA-256, examinou uma cópia dos arquivos do índice
  sem encontrar segredos (exit 0). `.env.example` contém somente modelos seguros.
  Esse scan não garante ausência de todo dado sensível. Build/testes da aplicação
  não repetidos: esta entrega prepara documentação/configuração Git, sem mudar runtime.
- Exclusões conferidas: `.env` reais, chaves privadas, dumps, configurações de IDE,
  `node_modules`, `target`, caches, builds, logs e `.tools/`. Documentos, código,
  assets originais, migrations e exemplos de configuração permanecem selecionados.
- Operação remota anterior à indicação da URL: criado o repositório privado vazio
  `GustavoKenz0/dogmania-sistema`, conforme pedido inicial de criação. Não recebeu
  commit/push nem foi selecionado como destino após o usuário informar outro link.
  Não foi excluído automaticamente.
- Pendência: primeiro commit proposto `chore: adiciona sistema Dogmania completo e documentação`
  e push para `origin/main` aguardam aprovação explícita. Nenhum commit ou push foi
  executado nesta preparação. Nas próximas entregas, atualizar este arquivo antes
  de apresentar o conteúdo para aprovação.

### 2026-10-19 — 004 — Aprovação e execução do envio inicial

- Pedido: o usuário respondeu “aprovo” à proposta de commit e push do projeto
  revisado para `GustavoKenz0/DogMania-Catalogo`, branch `main`, após escolher uma
  mensagem sem o prefixo `chore:`.
- Escopo aprovado: 122 arquivos, incluindo 12 documentos, com credenciais locais,
  chaves, dumps, dependências instaladas, caches e builds excluídos.
- Verificação antes da execução: árvore preparada correspondeu exatamente à
  revisão anterior; não havia alterações adicionais ou arquivos novos fora do
  índice e o remoto estava sem refs. O scan de segredos será repetido incluindo
  este registro documental antes do commit.
- Alteração desta etapa: somente este arquivo registra a aprovação. Código da
  aplicação, configuração e demais documentos permanecem como revisados.
- Operação autorizada: commit “Adiciona projeto completo da Dogmania e documentação”
  e push para `origin/main`, sem force push. Confirmar hash local versus ref remota
  ao concluir. O próprio histórico Git registra o identificador do commit, sem
  necessidade de um segundo commit para escrever seu hash neste documento.
- Pendências técnicas da aplicação: permanecem as listadas na seção 6. Essa
  aprovação não autoriza commits ou pushes de futuras mudanças.

### 2026-10-19 — 005 — Preparação da configuração local do banco e backend

- Pedido: configurar banco e backend para executar localmente.
- Descobertas: projeto movido de Downloads para Desktop, sem credenciais Supabase
  no ambiente ou arquivo local real. Maven está no cache Wrapper, mas não no PATH;
  JDK disponível é Oracle 26. A cópia em `.tools/publish-review/` não é o backend real.
- Alterações e motivo: import opcional de `.env.local` em formato Java properties;
  configurador PowerShell com leitura oculta de senhas, JWT criptograficamente
  aleatório, TLS verify-full e arquivo protegido/ignorado pelo Git. Launcher
  Windows encontra Maven disponível e valida campos antes de iniciar. Processador
  Lombok explícito no POM corrige compilação no JDK instalado. READMEs e template
  de variáveis explicam o fluxo e o bootstrap temporário.
- Arquivos: `backend-api/src/main/resources/application.yml`, `backend-api/pom.xml`,
  `backend-api/configure-local.ps1`, `backend-api/start-local.ps1`,
  `backend-api/.env.example`, `backend-api/README.md`, `README.md` e este contexto.
- Verificações: sintaxe PowerShell validada; configurador exercitado com valores
  sintéticos e sem rede em `.tools/`, verificando ACL protegida, segredo JWT,
  caracteres especiais e `-Check`. `.env.local` confirmado ignorado pelo Git.
  Após corrigir erro inicial de sintaxe e anotação Lombok, compilação limpa de 29
  fontes e 31 testes aprovados (zero falhas/erros/ignorados) no JDK 26, alvo Java 21.
- Revisão de publicação desta etapa: oito arquivos alterados, `git diff --check`
  aprovado e Gitleaks 8.30.1 sem segredos encontrados na cópia desses arquivos.
- Limitações: não foi criado `backend-api/.env.local` com dados reais. Nenhuma
  conexão ou migration remota, criação de role/admin ou Storage foi executada.
  O teste isolado usa dados falsos em pasta de ferramentas ignorada pelo Git.
- Pendência para concluir o pedido: identificar o projeto Supabase e configurar
  credenciais localmente; aplicar/verificar schema e role, criar primeiro admin
  se necessário e validar o backend realmente conectado. Pergunta enviada ao
  usuário solicitando somente a URL pública do projeto, sem senhas/chaves no chat.
  Sem commit ou push desta entrega; a aprovação anterior cobre somente o envio inicial.

### 2026-10-19 — 006 — Identificação da conexão e preparação da instalação Supabase

- Pedido em andamento: configurar banco e backend. Usuário forneceu URL pública
  real, chave publicável e parâmetros do session pooler; confirmou que ainda não
  executou as migrations. Chave publicável não autentica JDBC e não foi incorporada
  ao frontend, ao backend nem ao histórico. Não foram recebidas senhas privadas.
- Alteração: gerado `.tools/supabase-initial-setup.sql` para facilitar a execução
  manual em projeto novo e vazio pelo SQL Editor. O arquivo concatena, sem alterar
  seu conteúdo e na ordem documentada, as duas migrations canônicas já existentes.
  É um artefato local ignorado pelo Git; a fonte versionada continua em
  `supabase/migrations/`. Não inclui seed, Storage ou senha de runtime.
- Arquivos: artefato local acima e `CONTEXTO_DO_PROJETO.md`.
- Conferência: conteúdo comparado com a concatenação das migrations de origem.
  Nenhum teste de aplicação foi executado nesta etapa. Nenhum SQL remoto foi
  executado por esta IA e a conexão JDBC ainda não foi validada.
- Pendências: usuário aplicar o arquivo no painel e informar resultado; provisionar
  LOGIN e senha exclusiva da role dogmania_api localmente; gerar configuração local
  com usuário no formato dogmania_api.PROJECT_REF para session pooler; iniciar API,
  criar administrador e confirmar conexão. Backend continua sem `.env.local` real.
  Nenhum commit ou push executado; mudanças seguem aguardando aprovação específica.
### 2026-10-19 — 007 — Assistente local de provisionamento da role Java

- Pedido em andamento: configurar banco e backend; usuário informou “Success.
  No rows returned” após aplicar as duas migrations no SQL Editor do novo projeto.
  Esse relato é a evidência da aplicação remota; não houve inspeção independente.
- Alterações: assistente PowerShell recebe host e identificador públicos e executa
  ferramenta Java interativa fora da aplicação. Reutiliza o driver JDBC gerenciado
  pelo BOM/cache Maven do backend. Solicita senha postgres em terminal, confere
  schema/RLS e role não privilegiada, configura senha SCRAM-SHA-256 e LOGIN em
  transação, e confere acesso com a role restrita. Recusa role previamente habilitada
  e arquivo local existente; não rotaciona credenciais inadvertidamente.
- O Java usa o codificador SCRAM do próprio driver e limpa arrays de senha quando
  possível. Senha postgres não é persistida e nenhum segredo vai em argumentos,
  logs ou variáveis de ambiente. Falhas JDBC mostram SQLSTATE, sem SQL/stack trace.
  TLS verify-full com DefaultJavaSSLFactory usa a confiança padrão do Java;
  pg_stat_ssl não é usado para inferir TLS entre cliente e pooler.
- Configurador existente passou a aceitar URL e usuário como parâmetros públicos,
  preservando prompt interativo quando omitidos, JWT aleatório e ACL do .env.local.
  Após provisionar, usuário informa novamente a senha restrita e dados do admin.
- Arquivos: `backend-api/setup-supabase.ps1`,
  `backend-api/tools/ProvisionDatabase.java`, `backend-api/configure-local.ps1`,
  `backend-api/README.md`, `supabase/README.md` e este contexto.
- Verificações: ferramenta compilada com javac --release 21 e driver 42.7.11;
  sintaxe dos dois scripts PowerShell aprovada pelo parser; versão do driver
  resolvida corretamente a partir do BOM 3.5.16; git diff --check aprovado e
  artefatos compilados ignorados. Gitleaks 8.30.1 sem ocorrências nos seis arquivos
  desta etapa, copiados para pasta de revisão local ignorada. Nenhum teste de
  aplicação foi solicitado ou executado nesta etapa; a ferramenta não foi
  executada contra o Supabase por esta IA. .env.local real continua ausente.
- Pendências: usuário executar assistente em terminal local com sua senha do banco;
  confirmar conexão runtime, criar .env.local, iniciar backend e primeiro admin.
  Storage/upload permanece opcional e desabilitado. Sem commit ou push.

### 2026-10-19 — 008 — Configuração real e documento privado de credenciais

- Pedido: usar ferramentas locais/VS Code/navegador para configurar o site e entregar
  documento com logins/senhas do banco. Usuário definiu o e-mail do administrador e
  digitou a senha existente em campo oculto de uma janela local, sem enviá-la ao chat.
- Alterações: criado `complete-local.ps1` para gerar senhas distintas de runtime
  e admin, chamar o provisionador e escrever `.private/ACESSOS_DO_SISTEMA.local.txt`.
  Esse documento privado é a exceção expressamente autorizada pelo usuário e não
  substitui este relatório único, que permanece sem segredos. Criados helper de
  segurança local e exclusão de `.private/` no Git. Configurador aceita senhas
  como SecureString em memória, sem argumentos de processos externos com valores.
- Erros corrigidos durante configuração: módulo Security do PowerShell 7 herdado
  por filho Windows PowerShell 5 causava falha de autoload; helper importa a versão
  correspondente ao PSHOME. Aplicação de ACL que exigia privilégio de auditoria foi
  substituída por icacls limitado à DACL, conferindo usuário/SYSTEM e ausência de
  herança/links antes da gravação. Tentativas anteriores falharam antes de configurar
  credenciais remotas; a nova janela foi confirmada no estágio de entrada de senha.
- TLS: Java apresentou SSLHandshakeException/SunCertPathBuilderException no pooler.
  CA público foi baixado por HTTPS do endereço configurado no código oficial de
  Supabase Studio, guardado localmente e passado ao pgJDBC como sslrootcert com
  verify-full. Sem desativar validação ou alterar truststore global. CA válido até
  26/04/2031; SHA-256 do arquivo:
  `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`.
- Operações remotas autorizadas: verificadas tabelas/RLS e role sem privilégios de
  dono; definida senha SCRAM-SHA-256 e habilitado LOGIN de dogmania_api em transação;
  conexão JDBC dessa role confirmada. Backend Hibernate validou schema PostgreSQL
  17.11 e bootstrap criou primeiro ADMIN. Nenhum seed, produto de teste ou Storage
  foi aplicado e nenhuma senha de operador foi alterada.
- Runtime: criados envs locais protegidos/ignorados; frontend aponta à API local.
  Tomcat no JDK 26 falhou com Invalid argument em socket AF_UNIX devido ao TEMP
  longo herdado. Launcher passou a criar `.tools/jtmp` e usar arquivo de
  argumentos Java para preservar espaços no caminho. Ajuste somente do processo.
- Correção funcional: listagem administrativa sem termo retornava 500 por
  `lower(bytea)` no PostgreSQL, devido a bind nulo na concatenação. JPQL de
  ProductRepository agora faz CAST explícito do termo para string. Backend
  recompilado (29 fontes, alvo Java 21, sem executar testes), recarregado pelo
  DevTools e consulta confirmada com/sem busca no banco real.
- Credenciais e operação: login confirmado; bootstrap desativado e senha do admin
  removida da configuração de runtime. Documento privado preserva os acessos
  solicitados. Requisições temporárias base64 (não criptografadas) foram protegidas
  antes de gravadas e removidas ao terminar; nunca foram argumentos, logs ou commits.
  `.private/setup-status.local.json` registra apenas estágio/diagnóstico sem segredo.
- Arquivos: `.gitignore`, `AGENTS.md`, `README.md`,
  `backend-api/{complete-local,local-security,configure-local,setup-supabase,start-local}.ps1`,
  `backend-api/tools/ProvisionDatabase.java`, `backend-api/README.md`,
  `backend-api/src/main/java/com/dogmania/api/repository/ProductRepository.java`,
  `supabase/README.md` e este contexto; dados locais em envs, .private e .tools.
  package.json/package-lock.json novos na raiz são alterações preexistentes do usuário
  e não foram modificados nem selecionados para publicação nesta etapa.
- Verificações realizadas: compilação da ferramenta com --release 21 e driver
  42.7.11; cinco scripts PowerShell com sintaxe válida; compilação Maven do backend
  aprovada sem testes; JDBC real com CA/TLS e role confirmados; login e /auth/me,
  listagens admin com/sem busca, catálogo público, site e painel respondendo;
  CORS devolve a origem local correta; catálogo com zero produtos. Conferidas
  exclusões de documento, CA e envs pelo git check-ignore. Revisão final:
  git diff --check aprovado; Gitleaks 8.30.1 sem ocorrências em cópia dos 16 arquivos
  selecionados de código/documentação; pasta privada, documento e env do backend
  com herança bloqueada e duas regras (usuário e SYSTEM); zero arquivos temporários
  de requisição restantes. Bootstrap desativado e senha vazia confirmados sem
  mostrar valores. Não afirmar testes completos de CRUD/pentest/E2E.
- Limitações: Computer Use não expunha node_repl; não foi possível controlar
  visualmente VS Code/navegador. Trabalho feito por arquivos, CLI e requisições
  locais autorizadas. Upload Storage segue desabilitado; editor aceita URL HTTPS.
  Homologação completa, políticas Storage, backups/restauração, hospedagem e
  auditoria de dependências continuam pendentes. Nenhum commit/push executado;
  qualquer envio exige nova aprovação do usuário.

### 2026-10-19 — 009 — Aprovação do envio da configuração local

- Pedido: usuário respondeu “aprovo” à proposta de commit e push dos 16 arquivos
  de código/documentação da configuração Supabase e execução local, com mensagem
  “Configura banco Supabase e execução local da Dogmania”, para
  GustavoKenz0/DogMania-Catalogo, branch main.
- Escopo: scripts locais, ferramenta Java, correção da consulta de produtos,
  configuração de carregamento local/Lombok, regras de exclusão e documentação.
  Documento de senhas, envs reais, certificado local, logs, ferramentas, builds
  e demais dados privados continuam excluídos. package.json/package-lock.json
  novos na raiz pertencem ao usuário e não entram neste commit aprovado.
- Conferência antes do envio: 15 arquivos correspondem exatamente à cópia revisada;
  contexto acrescentou os resultados finais e esta aprovação, sem mudar runtime.
  Main local e remota partiam do mesmo commit 5492b12018a439981329506b4b2a13efa49629cf.
  Os quatro caminhos privados principais continuam ignorados pelo Git.
- Operação autorizada: selecionar somente os 16 arquivos, repetir revisão de
  segredos no conteúdo do índice, criar commit com a mensagem aprovada e executar
  push normal para origin/main. Conferir hash local versus ref remota ao concluir;
  o próprio histórico Git guarda o identificador, evitando commit adicional
  exclusivamente para escrever o hash neste documento.
- Sem nova alteração funcional nesta etapa e sem repetição de testes. Evidências
  de configuração permanecem na entrada 008. Esta aprovação cobre somente este
  envio; mudanças futuras continuam exigindo autorização própria.

<!-- Próximas entradas: usar data real America/Sao_Paulo e próximo número sequencial.
Registrar pedido; alterações/motivos; arquivos; verificações/resultados; pendências.
Não registrar segredos. Preservar o histórico e atualizar as seções de estado atual. -->
