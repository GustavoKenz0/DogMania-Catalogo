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

## 5. Como executar e validar

Pré-requisitos: JDK 21, Maven 3.9 e Bun; banco Supabase configurado.

1. Seguir `supabase/README.md` para migrations, role de runtime e conexão TLS.
2. Configurar as variáveis de `backend-api/.env.example` na IDE ou no ambiente.
   Spring Boot não carrega esse arquivo automaticamente. JWT e senha JDBC não têm
   segredo funcional padrão. O primeiro admin usa bootstrap opt-in, depois desabilitado.
3. Em `backend-api/`: `mvn spring-boot:run` — API na porta 8080.
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
- Smoke: URL remota recusada; conexão local indisponível contou como falha. Não
  foi executado contra uma API completa conectada ao banco hospedado.

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

<!-- Próximas entradas: usar data real America/Sao_Paulo e próximo número sequencial.
Registrar pedido; alterações/motivos; arquivos; verificações/resultados; pendências.
Não registrar segredos. Preservar o histórico e atualizar as seções de estado atual. -->
