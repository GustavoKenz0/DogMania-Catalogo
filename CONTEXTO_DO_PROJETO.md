# Dogmania — contexto e histórico de alterações

Última atualização: **21/10/2026** (America/Sao_Paulo).

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

`.vscode/settings.json` é compartilhado como configuração de projeto segura:
exclui `.tools/` da importação Java/Maven e de recursos do servidor Java,
além de busca/watchers/explorador, evitando analisar cópias antigas como fontes.
Os outros arquivos do editor continuam ignorados. Os diagnósticos das fontes reais
não são desativados; reiniciar/limpar o workspace Java pode ser necessário para
remover importações antigas do cache do editor.
A extensão Red Hat Java 1.57.0 também apresentou regressão confirmada com construtores
Lombok/Java 21: neste computador foi instalada e fixada a 1.56.0. Recarregar a
janela ativa para adotá-la. Ver README e entrada 012; a instalação não viaja no Git.
O backend usa lombok.config com contratos Spring; análise de nulidade permanece ativa.

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

A home / e a página /produtos compartilham CatalogHeader branco, com busca e navegação por
animais/departamentos. Categorias atuais do frontend: Cães, Gatos, Pássaros,
Peixes, Outros Pets, Rações, Higiene e Brinquedos; o editor administrativo compartilha
a lista. Rótulos Cachorro/Gato/Pássaro/Peixe no menu preservam os valores de categoria
correspondentes. Busca e categoria são controladas pelos parâmetros busca/categoria
na URL e aplicadas ao catálogo real. Na entrada 025, dropdowns ancorados foram
adicionados novamente por pedido explícito, com links para subcategoria na URL.
Cachorro contém 13 opções após a simplificação da entrada 026; demais categorias
usam listas correspondentes. O nome da categoria navega para todos os seus produtos;
hover abre o dropdown e uma seta separada faz essa abertura em dispositivos de toque.
Os painéis contêm somente os links de subcategoria, sem título nem Ver todos.
Enquanto um dropdown está aberto, uma camada preta com 52% de opacidade cobre
o conteúdo abaixo do limite real do header; cabeçalho e painel permanecem claros.
Clique na área escura fecha o menu. A camada permanece montada após hidratação,
com fade de 520 ms na entrada e 480 ms na saída, reversível ao retornar o mouse.
Saída por hover aguarda 280 ms; fora do estado aberto, a camada não recebe cliques
e termina oculta. Essa transição também fica ativa com reduzir movimento, seguindo
a preferência explícita do usuário por manter essas animações globais.
Todos continua sendo o acesso direto ao catálogo inteiro. taxonomy.ts centraliza
opções, validação e relações explícitas entre animais e departamentos.
A animação atual segue o vídeo enviado em 21/10/2026: com mouse/hover, o animal
surge crescendo à esquerda do nome, na mesma linha, com texto dourado e sublinhado.
Sem avatar circular, fundo de cartão ou deslocamento vertical do rótulo. O espaço
do ícone abre em 420 ms e o desenho cresce em 520 ms; a caixa mede 40 px, ou 32 px
em desktops entre 1024 e 1279 px. Categorias em painéis estreitos mantêm largura
fixa e rolagem própria. Em toque, os desenhos ficam visíveis; foco de teclado preservado.
Os estilos continuam compartilhados na home e catálogo. A pedido expresso do usuário,
a animação das categorias agora permanece ativa também com prefers-reduced-motion: reduce.
A exceção é global para todos os usos de CatalogHeader e limitada à árvore dos botões
de categoria; o restante da interface conserva suas regras de redução de movimento.
O desenho inteiro faz um mini bounce em catalog-pet-motion, separado da entrada
em catalog-pet-avatar: salto de 10 px e acomodação em 600 ms, após atraso de 280 ms,
uma vez por hover/foco, sem deslocar o texto. Usa transform no elemento interno
para não competir com o crescimento/rotação do elemento externo.
Na home, nomes de categorias, envio da busca e links do dropdown abrem /produtos com os filtros correspondentes;
no catálogo, os filtros continuam controlados pela URL. SiteHeader continua no
detalhe individual do produto. A home mantém o carrossel de fotos reais e quatro
destaques ativos da API, com atalhos por departamento e contato oficial.

Subcategorias voltaram a integrar o frontend e o contrato Java na entrada 025,
reutilizando a coluna e a migration 20261020010000_product_subcategories.sql já
aplicada e preservada na reversão. Nenhuma nova migration ou escrita em produtos
foi necessária. ProductEditor permite classificação opcional por categoria; a API
persiste e retorna subcategory. Produtos sem classificação permanecem na categoria
principal, sem classificação inferida pelo nome. Filtros específicos não inventam
resultados. Adestramento e Comportamento, Raças e Marcas foram retirados da lista
na entrada 026. Valores antigos já gravados não foram apagados do banco.

## 3. Regras e contratos que atravessam as camadas

- Produto: ID UUID, nome, descrição, preço, categoria, subcategoria opcional, imagem HTTPS, selo opcional
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
3. `supabase/migrations/20261020010000_product_subcategories.sql` — coluna opcional
   subcategory, CHECK de comprimento, índice parcial e classificação dos exemplos
   conhecidos por UUID/nome exatos. Aplicada nesta instalação em 20/10/2026.
   Reutilizada pela aplicação na entrada 025; não reaplicar na instalação atual.

Tabelas: `products`, `admin_users`, `audit_logs`. A role de runtime `dogmania_api`
não é dona das tabelas e não possui bypass RLS. Papéis da Data API Supabase não
recebem grants nas tabelas da aplicação; o catálogo público também passa pelo Java.
Essa RLS distingue a identidade do servidor, não cada pessoa autenticada no Java.

Triggers produzem auditoria das alterações de produtos na transação. O Java não
persiste diretamente em `audit_logs`. O banco registra a identidade da conexão;
logs da aplicação complementam o administrador autenticado. Após bootstrap,
revogar INSERT em `admin_users` reduz os privilégios de runtime.

Em 20/10/2026, a pedido do usuário, seis produtos fictícios [EXEMPLO] foram
cadastrados pela API e confirmados por JDBC independente no Supabase real configurado:
cinco ativos e um sem estoque. Dados e UUIDs estão na entrada 013. Ferramenta repetível
em tests/catalog/criar-e-validar-exemplos.ps1, com fixtures e verificador JDBC;
a repetição não duplica exemplos idênticos nem sobrescreve exemplos editados.

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

Em 20/10/2026 foi criada também uma conta administrativa adicional, ativa, com
perfil ADMIN. E-mail e senha definidos pelo responsável estão somente no documento
privado de acessos; login e /auth/me confirmados. A conta anterior foi preservada.

Por solicitação expressa do usuário, os acessos de operador PostgreSQL, runtime
e administrador do site estão exclusivamente em
`.private/ACESSOS_DO_SISTEMA.local.txt`. O arquivo contém senhas legíveis e
possui DACL restrita ao usuário atual e SYSTEM; isso não criptografa o conteúdo.
Não copiar valores para contexto público, logs ou mensagens. A pasta inteira
`.private/`, os envs reais e `.tools/` estão ignorados pelo Git.

## 5. Como executar e validar

No Windows já configurado, o ponto de entrada simplificado é
`Iniciar Dogmania.cmd`, na raiz. Ele chama `iniciar-local.ps1`, abre os
serviços em janelas separadas, reaproveita serviços disponíveis, aguarda respostas
da API/site e abre o navegador. Fechar as janelas dos serviços ou usar Ctrl+C
encerra o uso local. Nenhum provisionamento ou instalação automática é disparado.

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

### 2026-10-20 — 010 — Iniciador local com dois cliques

- Pedido: criar o arquivo “Iniciar Dogmania” para iniciar backend/frontend e abrir
  o site sem repetir os comandos manualmente a cada uso.
- Alterações: `Iniciar Dogmania.cmd` chama o auxiliar `iniciar-local.ps1`
  com caminhos relativos à raiz. O auxiliar confere configuração/dependências,
  usa o launcher Java existente e Bun, abre janelas separadas com títulos claros,
  reutiliza serviços com respostas esperadas e aguarda API/site por até 120 segundos
  antes de abrir o navegador. Exibe erros e não mata serviços que ocupam as portas.
  Uma trava local em `.tools/launcher.lock` evita inicializações simultâneas;
  o handle é liberado ao concluir ou falhar. Nenhuma senha é passada em argumentos,
  copiada para logs ou lida do documento privado.
- Arquivos: `Iniciar Dogmania.cmd`, `iniciar-local.ps1`, `README.md`
  e `CONTEXTO_DO_PROJETO.md`. Arquivos do usuário na raiz preservados.
- Verificações: parser do Windows PowerShell aprovou a sintaxe; git diff --check
  aprovado; Gitleaks 8.30.1 sem ocorrências na cópia dos quatro arquivos. Revisão
  estática identificou e corrigiu aspas removidas pelo transporte de argumentos do
  Windows PowerShell ao gravar o patch; caminhos com espaços estão entre aspas
  no CMD e na abertura das janelas. O iniciador não foi executado e nenhuma suíte
  de testes foi adicionada/executada, conforme escopo de criar o arquivo.
- Limitações: exige banco, env local, JDK/Maven/Bun e dependências previamente
  configurados. Serviços precisam permanecer em execução nas janelas abertas.
  Banco Supabase permanece remoto; o iniciador não cria nem reconfigura o banco.
- GitHub: nenhum commit/push desta entrega; nova aprovação é necessária antes
  de publicar os quatro arquivos desta alteração.

### 2026-10-20 — 011 — Cópias temporárias gerando diagnósticos no VS Code

- Pedido: verificar e corrigir erros na pasta .tools. Captura do usuário mostra
  avisos em .tools/publish-review/backend-api, inclusive AdminBootstrap e entidades.
- Diagnóstico: identificadas três cópias Maven auxiliares além do backend real,
  todas com o mesmo identificador com.dogmania:dogmania-api:1.0.0. O POM de
  publish-review está desatualizado em relação ao real. Configuração local do VS Code
  continha apenas nullAnalysis automático, sem exclusões Java para .tools.
  A captura mostra contagens de diagnósticos, sem seu texto; não equivale a evidência
  de defeito específico nas classes do backend que está rodando.
- Correção: configuração de importação Java/Maven e filtros de recursos exclui
  temporários e dados privados, mantendo os defaults relevantes das extensões.
  Excluídos .tools de busca/watchers/explorador para evitar editar cópias; suporte
  Lombok permanece ativo e atualização de build Java é automática. Validação de
  código real continua habilitada. Arquivos temporários foram preservados.
- A exceção no .gitignore permite versionar somente .vscode/settings.json da raiz,
  que contém padrões seguros de projeto. Demais arquivos de IDE continuam ignorados.
  Instrução de limpeza do cache Java foi documentada para diagnósticos anteriores.
- Arquivos: .vscode/settings.json, .gitignore, README.md e este contexto.
  Iniciador da entrada 010 e arquivos do usuário continuam sem publicação.
- Verificações: JSON da configuração válido; padrões e nomes das propriedades
  conferidos nas extensões Java/Maven instaladas. Preferência nullAnalysis existente
  preservada e Lombok ativo. Maven offline compile do backend real retornou
  BUILD SUCCESS, com classes já atualizadas; nenhuma suíte de testes foi executada.
  git diff --check aprovado e git check-ignore confirma que settings.json pode
  ser versionado enquanto launch.json, tasks.json, ferramentas e credenciais
  continuam ignorados. Gitleaks 8.30.1 sem ocorrências na cópia dos seis arquivos
  pendentes (correção do editor mais iniciador da entrada 010). Nenhum código
  de negócio ou migration alterado.
- Limitação: não há acesso nesta sessão ao painel Problemas do editor ou controle
  visual para forçar limpeza do workspace Java. Mensagens já emitidas para cópias
  abertas podem exigir o comando Java: Clean Java Language Server Workspace.
- GitHub: sem commit/push. A aprovação anterior cobre somente o envio já realizado;
  publicação das mudanças do iniciador e desta correção depende de nova aprovação.

### 2026-10-20 — 012 — Regressão da extensão Java e avisos do backend real

- Pedido: usuário mostrou 89 diagnósticos no backend real, incluindo Java(4195411)
  Flexible Constructor Bodies nas anotações Lombok e avisos de nulidade/depreciação.
  A correção 011 tratava as cópias em .tools e não resolvia esta segunda causa.
- Causa confirmada: Red Hat Java 1.57.0 instalada contém regressão de ECJ/Lombok,
  documentada em https://github.com/redhat-developer/vscode-java/issues/4521
  e https://github.com/redhat-developer/vscode-java/issues/4544. Não é uso de sintaxe
  Java 25 nas fontes. A versão 1.56.0 foi instalada pelo CLI oficial do VS Code;
  registro local de extensões confirma 1.56.0 com pinned=true. É necessário
  recarregar a janela já aberta para ativá-la. Não houve elevação do source level,
  habilitação de preview ou desativação da análise para ocultar erros.
- Código: DaoAuthenticationProvider recebe UserDetailsService pelo construtor atual;
  removidos construtor vazio/setter obsoletos. Mocks existentes usam MockitoBean
  do Spring Framework em vez de MockBean descontinuado. Política HTTP/JWT/CORS
  preservada, com lambdas equivalentes para evitar falsos avisos no receptor de
  referências de métodos. Lombok configurado com addNullAnnotations=spring e
  stopBubbling, para contratos dos métodos gerados sem nova dependência.
- Nulidade: IDs e entidades obrigatórias são conferidos nos acessos ao repositório;
  handler de erro declara HttpStatus obrigatório. Exceções têm serialVersionUID.
  Fixtures e JSON dos testes existentes explicitam valores obrigatórios. Fixtures
  de ProductServiceTest passam a campos finais por instância, preservando o ciclo
  padrão de uma instância JUnit por teste. Matcher Mockito preservado em adaptador
  anyProduct; somente esse pequeno método tem SuppressWarnings(null), pois Mockito
  retorna deliberadamente um sentinela nulo ao registrar o matcher. Não envolver
  matchers em requireNonNull: isso quebraria seu funcionamento. Demais diagnósticos
  de nulidade continuam habilitados.
- Arquivos desta correção: backend-api/lombok.config; SecurityConfig;
  GlobalExceptionHandler; ResourceNotFoundException; UnauthorizedException;
  ProductService; AuthControllerTest; ProductControllerTest; ProductServiceTest;
  README e este contexto. Fontes alteradas somente no backend real da raiz.
- Verificações: Maven offline test-compile com skipTests retornou BUILD SUCCESS,
  mas utilizou classes já atualizadas pelo editor, sem comprovar recompilação total.
  Para eliminar essa limitação, javac do JDK 26 foi executado com --release 21,
  classpath/processador Lombok resolvidos pelo Maven e saída isolada em .tools:
  todas as 35 fontes principais/testes recompiladas, exit 0, sem diagnósticos de
  depreciação ou tipos unchecked no código. ECJ batch da extensão 1.56.0 + Lombok,
  source 21, análise nullAnnot(Spring)/inheritNullAnnot: mesmas 35 fontes, exit 0,
  sem erros ou avisos de código. Permanece aviso da JVM sobre sun.misc.Unsafe
  usado pelo próprio Lombok no JDK instalado; não é erro das fontes. Nenhuma
  suíte de testes foi executada/adicionada; compilar testes não valida seu runtime.
- Revisão final: git diff --check aprovado; Gitleaks 8.30.1 sem ocorrências
  nos 15 arquivos selecionados, abrangendo iniciador, configuração do editor,
  correções Java e documentos. git check-ignore confirma que documento privado,
  env real, logs e launch.json continuam ignorados. nullAnalysis segue automatic.
- Limitações: painel Problemas da janela ativa não pôde ser inspecionado ou
  recarregado por ferramenta desta sessão. A evidência é compilação independente
  dos mesmos arquivos, não leitura posterior dos 89 itens no editor. Recarregar
  VS Code e limpar workspace Java se permanecer cache antigo. Sem migrações,
  alteração de dados do banco, frontend, credenciais ou serviços alheios.
- GitHub: iniciador 010, exclusões 011 e correção 012 permanecem pendentes de
  aprovação para commit/push. package.json e package-lock.json novos da raiz
  pertencem ao usuário e não fazem parte da seleção proposta.

### 2026-10-20 — 013 — Produtos de exemplo e validação real de API/PostgreSQL

- Pedido: criar produtos no sistema para testar a validação do backend/banco e
  confirmar se os registros realmente ficam salvos. Autorizada a criação dos
  exemplos no Supabase configurado, por meio da API local autenticada.
- Situação inicial: API 8080 retornou HTTP 200 e catálogo com zero produtos;
  frontend 8081 estava parado. Foram criados seis produtos via POST /products,
  cada um com HTTP 201 e UUID próprio. Todos têm prefixo [EXEMPLO], descrição
  de produto fictício, preço de demonstração e fotografia ilustrativa HTTPS.
  Cinco categorias compatíveis com a interface atual; um exemplo fica inativo.
- Ferramenta: tests/catalog/produtos-exemplo.json contém os seis payloads;
  criar-e-validar-exemplos.ps1 autentica localmente, cadastra/reutiliza exemplos,
  valida entradas e executa CRUD em um registro temporário próprio. Por padrão,
  pede credenciais em prompt oculto; UseLocalCredentials é opt-in explícito para
  ler o documento privado existente. Token/senhas ficam apenas em memória e não
  são impressos, gravados em código, argumentos ou relatórios. O verificador
  VerifyExampleProducts.java usa a role JDBC de runtime, TLS verify-full e consulta
  independente da conexão usada pelo Spring, lendo o env privado existente.
- Produtos persistidos (nomes abaixo têm prefixo [EXEMPLO] no catálogo):

| Produto | Preço fictício | Estoque | UUID |
| --- | --- | --- | --- |
| Ração para cães adultos 10 kg | R$ 129,90 | Ativo | e9957b23-71c2-4c9e-ad6a-d25702b0d634 |
| Ração para gatos castrados 1 kg | R$ 39,90 | Ativo | 7a83efdd-e57b-4d80-9f81-e88f5bf999a2 |
| Bola mordedor para cães | R$ 24,90 | Ativo | 09c80bab-5f2f-4c8d-bd97-ab55af3b4313 |
| Shampoo neutro para pets 500 ml | R$ 29,90 | Ativo | 6694041c-ac79-4353-8d22-1b8253fc9b78 |
| Coleira ajustável para cães | R$ 34,90 | Ativo | ca357320-1e50-4fa6-804a-79c6e5158ef4 |
| Areia higiênica para gatos 4 kg | R$ 19,90 | Inativo | 5973574f-5156-4d72-bffe-a29590025546 |

- Resultado da execução completa: 38 verificações HTTP aprovadas, incluindo login,
  visibilidade dos seis exemplos, acesso anônimo de escrita negado, 14 cadastros
  inválidos, edição de nome/preço, edição inválida bloqueada, ativação/desativação,
  consulta pública, exclusão e contagem final. Doze payloads inválidos receberam
  400 com indicação de campo; nomes/categorias de um caractere receberam 409,
  conforme constraints do banco. O mínimo de dois caracteres nesses dois campos
  ainda é imposto pelo PostgreSQL, enquanto o DTO valida ausência/comprimento
  máximo; não afirmar que esse mínimo hoje retorna 400 pelo Bean Validation.
- JDBC: 18 verificações aprovadas. Confirmada role dogmania_api, existência dos
  seis UUIDs, valores de todos os campos e timestamps criados/atualizados. Dez
  provas SQL diretas confirmaram recusa de preço negativo/zero/NaN, nome ausente,
  nome de um caractere ou 151 caracteres, categoria ausente ou de um caractere,
  ordem negativa e overflow de numeric(10,2), conferindo SQLSTATE esperado.
  Cada prova foi isolada por savepoint e revertida; contagem antes/depois igual.
- Reexecução: reutilizou os seis registros com zero novos exemplos, demonstrando
  que não duplicou o catálogo. A primeira execução havia parado em uma asserção
  de contagem da própria ferramenta (array de paginação encapsulado); corrigido
  o helper, a execução completa passou. Não era falha de persistência da API.
- Dados finais: seis registros permanentes, cinco ativos; GET público retornou
  totalElements=5 e nenhum inativo. Registros temporários do CRUD removidos e
  inserts inválidos não persistidos. Nenhum produto pré-existente foi alterado.
- Visualização: frontend iniciado em segundo plano com Bun; /produtos retornou
  HTTP 200 e HTML Dogmania. Disponível em http://127.0.0.1:8081/produtos e painel
  /admin. Não houve inspeção visual/E2E pelo navegador. Logs e resultado técnico
  de execução ficam apenas em .tools ignorado; manifesto JDBC temporário removido.
- Arquivos: três ferramentas/fixtures em tests/catalog/, instrução no README
  e este relatório único. Nenhum código de runtime, migration ou senha alterado.
  Scripts seguem disponíveis para repetição explícita em desenvolvimento; eles
  gravam no banco apontado pela instalação e não são seed automático de produção.
- Revisão final: git diff --check aprovado; Gitleaks 8.30.1 sem ocorrências
  na seleção dos 18 arquivos pendentes das entregas 010–013, sem incluir envs,
  documento privado, logs ou package.json/package-lock.json próprios do usuário.
- Verificação adicional: parser PowerShell sem erros. Ajuste de stdout/stderr Java
  para UTF-8 após a execução evita caracteres quebrados no terminal Windows;
  os valores persistidos foram comparados corretamente em Unicode via JDBC.
- GitHub: esta solicitação não aprovou o commit/push pendente. Entregas 010–013
  continuam sem publicação; arquivos privados e arquivos próprios do usuário
  na raiz permanecem fora da seleção.

### 2026-10-20 — 014 — Administrador adicional e registro privado dos acessos

- Pedido: após corrigir o endereço e fornecer senha compatível, o usuário solicitou
  criar outro administrador e guardar os dados no arquivo privado de acessos.
  Os valores de login/senha não são reproduzidos neste relatório.
- Cadastro: adicionada uma conta ativa com perfil ADMIN e nome Administração Dogmania,
  usando e-mail normalizado em minúsculas e BCrypt com o mesmo encoder padrão da API.
  Foram aplicadas as regras atuais de e-mail, mínimo de 16 caracteres e máximo
  de 72 bytes UTF-8. O registro foi inserido por JDBC em transação no Supabase
  configurado, preservando TLS verify-full e as constraints existentes.
- Foi utilizada a credencial de operador já armazenada no documento privado somente
  para a inserção solicitada. Nenhum grant, policy, senha de outra conta, role de
  runtime, bootstrap, migration ou código de aplicação foi alterado. A rotina local
  recusa sobrescrever uma conta existente com dados diferentes. Conta anterior
  preservada; não foi criado endpoint público de cadastro de administradores.
- Tratamento dos acessos: novos valores recebidos por console com entrada oculta,
  fora dos argumentos de processo. Somente o hash BCrypt foi enviado ao campo
  password_hash. Acrescentada seção própria ao documento existente
  .private/ACESSOS_DO_SISTEMA.local.txt, mantendo os demais acessos. Nenhuma senha,
  hash, token ou credencial foi impresso em saídas ou copiado para arquivos públicos.
- Confirmações: commit da transação e leitura posterior confirmaram conta ativa,
  perfil ADMIN e hash correspondente. POST /auth/login e GET /auth/me da API local
  confirmaram autenticação e o perfil do novo acesso; token permaneceu em memória.
  Nenhuma suíte de testes foi adicionada ou executada nesta tarefa.
- Proteção local: documento privado com herança de ACL bloqueada e somente duas
  regras, usuário atual e SYSTEM. git check-ignore confirmou a exclusão do documento
  e do auxiliar Java local em .tools. O auxiliar não contém os valores das credenciais.
  Credenciais não foram incluídas em envs ou código; o bootstrap permaneceu desligado.
- Revisão: git diff --check aprovado; Gitleaks 8.30.1 sem ocorrências no relatório
  atualizado. Busca exata dos novos acessos nos 18 arquivos públicos pendentes
  encontrou zero ocorrências, sem mostrar seus valores nas saídas.
- Arquivos: documento privado solicitado e este relatório único. Auxiliar operacional
  em .tools ignorado, sem alteração em fontes de runtime ou dependências.
- GitHub: sem commit/push; aprovações anteriores não cobrem as entregas pendentes.
  O documento de acessos continua fora de qualquer seleção para publicação.

### 2026-10-20 — 015 — Cabeçalho do catálogo com categorias e animais animados

- Pedido: reestilizar o header da página de produtos conforme referência, dividir
  categorias e mostrar animação do animal relacionado no hover; no celular,
  manter o desenho ao lado de cada palavra. Em esclarecimento, o usuário escolheu
  manter Rações, Higiene e Brinquedos junto de Cachorro, Gato, Pássaro, Peixe e
  Outros Pets. Foi mantido também Todos como ação para remover o filtro.
- Layout: CatalogHeader específico para /produtos, fundo branco, logo Dogmania
  original azul/dourada, busca central larga, acesso ao início e contato real da
  loja pelo WhatsApp. Faixa inferior contém as categorias e indicação da seleção.
  Introdução da página usa fundo suave e título azul para acompanhar o cabeçalho.
  A logo original tem transparência confirmada (1254x1254, alpha do canto zero);
  enquadramento feito por CSS, sem editar o arquivo da imagem ou substituir a marca.
- Desenhos: PetDrawing contém SVGs locais para cachorro, gato, pássaro, peixe,
  coelho para Outros Pets e animais com acessórios para Rações/Higiene/Brinquedos.
  No desktop, hover/foco revela o desenho com animação de orelhas, piscar, língua,
  asas, cauda, bolhas ou bola conforme o item. Não foram adicionadas bibliotecas
  de animação, assets remotos ou animações de pixels que dependam de download.
- Responsividade: no celular/tablet, desenhos de 32px permanecem ao lado dos nomes
  em uma faixa com rolagem horizontal e indicação de deslizar. A busca ocupa linha
  própria. A partir de 1024px, categorias ocupam uma linha e o cabeçalho é sticky.
  Navegação usa botões semânticos com aria-pressed/aria-controls, foco visível e
  SVGs decorativos; contagem de resultados usa anúncio discreto para leitores de
  tela. Busca tem label, limpar e submissão que leva aos resultados. Fonte 16px
  no campo e botões de busca/limpar com alvo de 44px. prefers-reduced-motion
  desliga animações/transições do novo cabeçalho e a rolagem suave da busca.
- Integração: CatalogGrid recebe a categoria selecionada e usa os dados reais do
  hook/API; removidos os filtros duplicados e o estado de categoria isolado da grid.
  A rota valida categoria contra a lista permitida e controla busca/categoria na
  URL, com atualização sem reset de scroll. O parâmetro busca existente continua
  aceito. Cães/Gatos já cadastrados continuam com os mesmos valores persistidos.
  Pássaros/Peixes/Outros Pets foram incluídos no vocabulário compartilhado, ficando
  disponíveis também no select do editor administrativo existente. Backend/banco
  já recebem categoria como string; esta entrega não altera schema ou registros.
- Categorias vazias usam o estado vazio verdadeiro do catálogo. Não há atribuição
  automática de espécie baseada no nome/descrição: Rações, Higiene e Brinquedos
  seguem departamentos próprios, e Cachorro filtra a categoria Cães.
- Arquivos: Dogmania-Catalogo/src/components/CatalogHeader.tsx, PetDrawing.tsx,
  CatalogGrid.tsx; src/features/products/model.ts; src/routes/produtos.tsx;
  src/styles.css; este relatório único. Header da home/detalhe e fontes Java
  não foram alterados nesta tarefa. Nenhuma senha ou configuração privada acessada.
- Conferências: Prettier nos seis arquivos do frontend; tsc --noEmit aprovado;
  ESLint direcionado aos cinco arquivos TS/TSX alterados aprovado; bun run build
  concluiu cliente, SSR e saída Nitro com exit 0. Build emitiu avisos de dependências
  sobre vite-tsconfig-paths e diretivas use client do Radix, sem falhar. GET local
  /produtos retornou HTTP 200. git diff --check aprovado. Nenhuma suíte de testes
  foi criada/executada, conforme escopo e instrução vigente.
- Revisão de publicação: Gitleaks 8.30.1 sem ocorrências em cópia dos 24 arquivos
  públicos pendentes; sem inclusão de envs, documento de acessos, logs, builds ou
  arquivos próprios do usuário na raiz. Nenhum arquivo foi staged ou publicado.
- Limitação: esta sessão não disponibiliza ferramenta para inspecionar visualmente
  a página no navegador. Comportamento mobile/hover foi implementado por CSS, mas
  não houve validação visual ou E2E em viewport real. A prévia fica disponível em
  http://127.0.0.1:8081/produtos para revisão do usuário.
- GitHub: nenhum commit/push executado. São seis arquivos adicionais de frontend
  sobre as entregas pendentes, totalizando 24 arquivos públicos propostos com o
  contexto já incluído. Arquivos privados e package.json/package-lock.json próprios
  do usuário na raiz continuam fora da seleção. Nova aprovação é necessária.

### 2026-10-20 — 016 — Home alinhada ao visual da página de produtos

- Pedido: reestilizar também a página principal conforme a página de produtos.
- Cabeçalho: home reutiliza CatalogHeader com logo azul/dourada, fundo branco,
  busca, categorias, animações dos animais no desktop e desenhos visíveis no mobile.
  O componente ganhou callback opcional onSearchSubmit: na home, Enter/botão de
  busca abre /produtos?busca=...; cliques nas categorias abrem o catálogo filtrado,
  preservando o termo digitado. No catálogo, o callback não é fornecido, mantendo
  o filtro em tempo real e a submissão que rola até os resultados. aria-controls
  é omitido quando a ação navega para outra página, evitando referência inexistente.
- Layout da home: introdução clara com título azul, destaque de Maringá, faixa de
  informações com links reais para WhatsApp/mapa/catálogo, seção de produtos com
  quatro destaques ativos, três atalhos de departamento e área de contato com
  desenhos vetoriais reutilizados. Espaçamentos, cores, bordas e superfícies seguem
  o catálogo; componentes e fotos existentes são reutilizados. O rodapé preserva
  os dados da loja. Links externos têm noopener/noreferrer e o WhatsApp oficial.
- Produtos: destaques continuam vindo de useProducts/API e excluem inativos; sem
  dados fictícios de fallback. Mantidos erro com tentar novamente e estado vazio
  com contato; loading usa quatro skeletons responsivos. A busca da home passa a
  consultar o catálogo completo ao enviar, em vez de filtrar apenas quatro itens.
- Carrossel: mantidos slides, fotos, controles, autoplay e layout existente, com
  alinhamento lateral à home, sombras suaves e destaque de texto azul mais legível.
  Os dois CTAs internos agora usam categorias tipadas: Brinquedos e Rações.
  O CTA de contato continua no WhatsApp. Não foi adicionada uma promoção nova.
- Responsividade/acessibilidade: grade de produtos 2/4 colunas conforme largura;
  áreas de informação e departamentos se reorganizam; ilustrações maiores da
  área de contato aparecem somente onde há espaço. Títulos/seções têm identificação,
  estados de erro/loading são anunciados e os novos hovers respeitam redução de
  movimento. Não houve inclusão de bibliotecas, assets ou rotas novas.
- Arquivos: Dogmania-Catalogo/src/routes/index.tsx;
  src/components/CatalogHeader.tsx; src/components/HeroCarousel.tsx;
  src/styles.css; este relatório único. Nenhuma credencial lida ou alterada,
  nenhum dado do banco e nenhuma fonte Java modificada nesta tarefa.
- Conferências: Prettier nos quatro arquivos; tsc --noEmit aprovado; ESLint
  direcionado aos três TSX alterados aprovado; GET / e /produtos em 127.0.0.1:8081
  retornaram HTTP 200; git diff --check aprovado. Nenhuma suíte de testes foi
  criada/executada, conforme instrução vigente. bun run build final aprovado
  (cliente, SSR e saída Nitro, exit 0). Permanecem avisos não fatais do bundler
  sobre vite-tsconfig-paths e diretivas use client de dependências Radix.
- Revisão para publicação: Gitleaks 8.30.1 sem ocorrências em cópia dos 26 arquivos
  públicos pendentes. Documento de acessos, envs reais, logs/builds e arquivos
  próprios do usuário na raiz não foram incluídos. Nenhum arquivo foi staged.
- Limitação: não há ferramenta de inspeção visual do navegador nesta sessão;
  não afirmar validação visual ou E2E das larguras e animações. A revisão visual
  pode ser feita na prévia local http://127.0.0.1:8081/.
- GitHub: sem commit/push. Esta entrega adiciona index.tsx e HeroCarousel.tsx à
  seleção pendente anterior, chegando a 26 arquivos públicos, com os demais
  arquivos compartilhados e relatório já contados. Dados privados, builds/logs
  e package.json/package-lock.json próprios do usuário na raiz seguem excluídos.

### 2026-10-20 — 017 — Subcategorias por animal/departamento e persistência

- Pedido: adicionar subcategorias dentro de cada categoria, como a lista de referência.
  Cachorro recebeu Ração; Petiscos e Ossos; Tapetes, Fraldas e Banheiros; Farmácia;
  Brinquedos; Coleiras, Guias e Peitorais; Beleza e Limpeza; Camas e Cobertores;
  Casas e Tocas; Acessórios de Alimentação; Acessórios de Transporte; Portões,
  Grades e Escadas; Roupas. As outras sete categorias têm listas próprias, adequadas
  a gatos, pássaros, peixes, outros pets e aos departamentos existentes.
- Interface: CatalogHeader compartilhado entre home e catálogo ganhou uma lista
  branca de subcategorias com cabeçalho ilustrado, Ver todos e botão de fechar.
  Abre no hover de mouse em desktop ou por clique/toque. Teclado permite abrir
  com seta para baixo, navegar por Tab e fechar com Escape retornando ao acionador;
  saída de foco, ponteiro ou clique externo fecha o painel. No celular, o painel
  se expande sob a faixa de categorias; a lista tem rolagem própria. IDs estáveis
  com useId, aria-expanded/controls e lista semântica preservam a acessibilidade.
- Catálogo: URL aceita subcategoria somente quando válida para a categoria;
  troca de categoria limpa o filtro anterior, busca preserva os filtros e chip
  permite remover só a subcategoria. Home encaminha ambos ao catálogo. Header,
  formulário e filtros reutilizam taxonomy.ts; não há classificação por palavras
  no título. Chaves/relações explícitas ligam, por exemplo, Cachorro > Ração ao
  produto salvo como Rações > Ração para cães, e itens de higiene comuns aos pets
  indicados. Esses relacionamentos ampliam a navegação frontend; o parâmetro
  category da API continua significando a categoria persistida, como antes.
- Administração: select opcional de subcategoria muda conforme a categoria e
  reinicia ao trocar a categoria. Valores desconhecidos já salvos continuam
  disponíveis na edição para evitar perda. Busca administrativa, listagem e cartões
  exibem/incluem o campo. O cliente HTTP já repassa os campos do modelo no DTO,
  não sendo necessário outro endpoint ou armazenamento local de produtos.
- Java: entidade Product, ProductDTO e ProductService receberam subcategory.
  DTO valida 2–80 caracteres quando preenchido; serviço normaliza branco/nulo,
  mapeia criação, atualização e leitura. O campo pode ser removido em atualização
  completa. Sem mudança de autenticação, autorização ou demais operações CRUD.
  O vocabulário das opções é controlado pelo frontend, enquanto API/banco validam
  comprimento; não afirmar que o backend hoje valida todas as combinações da lista.
- Banco: criada e aplicada 20261020010000_product_subcategories.sql, com coluna
  nullable varchar(80), CHECK de comprimento e índice parcial category/subcategory
  para ativos. Aplicação por JDBC do operador já existente, em transação, TLS
  verify-full, sem expor acessos em argumentos/saídas. Dados, privilégios, RLS e
  contas anteriores preservados. Auxiliar operacional sem segredos em .tools ignorado.
- Dados atuais: a aplicação da migration encontrou sete produtos e preservou os
  sete. Preenchidos somente os seis exemplos da entrada 013 por UUID e nome exatos,
  apenas se o campo estava nulo. O sétimo registro não foi alterado. Classificações:
  ração cães -> Ração para cães; ração gatos -> Ração; bola -> Brinquedos para cães;
  shampoo -> Shampoos e Condicionadores; coleira -> Coleiras, Guias e Peitorais;
  areia -> Areias e Banheiros. Categorias principais, preços e estoque mantidos;
  os triggers existentes registram essas alterações de metadados e updated_at.
  Fixture dos exemplos atualizada com os mesmos valores, sem executar seu runner.
- Compatibilidade: produtos antigos sem subcategoria aparecem na categoria
  principal e podem ser classificados pelo painel; não aparecem em um filtro
  específico até terem classificação explícita. migration precisa ser aplicada
  antes da nova versão Java, pois Hibernate apenas valida. Ordem e contrato foram
  atualizados nos READMEs do banco e backend. Instalação atual já está migrada.
- Verificações: tsc --noEmit e ESLint dos dez arquivos TS/TSX alterados aprovados;
  Prettier nos arquivos frontend; build cliente/SSR/Nitro concluído com exit 0.
  Maven offline compile retornou BUILD SUCCESS com classes já atualizadas pelo
  editor; javac independente --release 21 recompilou as 35 fontes principais/testes
  em saída isolada com exit 0. Aviso de Unsafe do Lombok/JDK e avisos já conhecidos
  do bundler permanecem fora do código desta feature. Nenhuma suíte de testes
  foi criada/executada nesta entrega e a migration não foi rodada duas vezes.
- Evidência de integração em leitura: GET /produtos local retornou 200; API retornou
  seis produtos públicos, cinco contendo subcategory (o sexto exemplo classificado
  está inativo, e o registro não classificado ativo permanece sem o campo). JDBC
  confirmou coluna varchar(80), sete produtos totais e seis com subcategoria.
  Não afirmar teste E2E, visual ou de CRUD específico deste campo: não houve
  ferramenta de inspeção visual nem execução de testes funcionais nesta sessão.
- Arquivos: frontend CatalogHeader, CatalogGrid, ProductCard, model, taxonomy,
  ProductEditor, AdminPage, ProductManagementList, rotas index/produtos e styles;
  backend Product, ProductDTO, ProductService e README; migration nova e README
  Supabase; fixture tests/catalog/produtos-exemplo.json; este relatório único.
- Revisão final: git diff --check aprovado; Gitleaks 8.30.1 sem ocorrências em
  cópia dos 36 arquivos públicos propostos. Credenciais, envs, auxiliares, builds,
  logs e arquivos próprios do usuário na raiz continuam excluídos. Nenhum staging.
- GitHub: nenhum commit/push. Esta feature soma arquivos à seleção já pendente;
  dados privados, logs/builds e arquivos próprios do usuário na raiz permanecem
  excluídos. A publicação continua dependendo de aprovação explícita.

### 2026-10-21 — 018 — Reversão das subcategorias e restauração do visual anterior

- Pedido: voltar ao estado anterior porque o usuário não gostou da última mudança.
  Escopo: desfazer a entrada 017, preservando a home e o cabeçalho das entradas
  015/016 e os demais ajustes anteriores ainda pendentes de publicação.
- Comparação: todos os 36 arquivos selecionados na entrega 017 coincidiam com a
  cópia final em .tools/subcategories-review-f48884684d4e4ae0a296eef14daf31f6;
  não foram detectadas alterações intermediárias nesses arquivos. Os arquivos
  modificados antes da entrada 017 foram restaurados a partir da cópia da entrada
  016 (.tools/home-review-81d4361f813c4119a7e004325e7ede7c). Para os arquivos que
  não tinham mudanças anteriores à entrada 017, restaurou-se o conteúdo de HEAD.
- Frontend: removidos os menus suspensos, filtro/chip de subcategoria, rótulos nos
  cartões/listagem e campo no editor administrativo. Categorias voltaram à seleção
  direta; mantidos busca, animais, responsividade, home, carrossel e contatos da
  entrada 016. taxonomy.ts removido porque deixou de ter consumidores.
- Backend: entidade Product, ProductDTO e ProductService voltaram ao contrato sem
  subcategory; correções Java anteriores foram preservadas. Fixture dos seis
  exemplos voltou ao formato anterior. Nenhum runner de produtos foi executado.
- Banco: nenhuma conexão administrativa ou operação de escrita foi executada.
  A migration 20261020010000_product_subcategories.sql já aplicada foi preservada,
  assim como sua coluna nullable e os metadados existentes. A coluna extra não
  exige mapeamento no JPA restaurado; não foi criada migration destrutiva. Produtos,
  estoque, contas, acessos privados e demais dados existentes permanecem intactos.
- Arquivos: frontend CatalogHeader, CatalogGrid, ProductCard, model, rotas index e
  produtos, styles, ProductEditor, AdminPage e ProductManagementList; exclusão de
  taxonomy; backend Product, ProductDTO, ProductService e README; README Supabase;
  fixture tests/catalog/produtos-exemplo.json; este relatório único.
- Verificações: TypeScript tsc --noEmit aprovado; ESLint dos nove arquivos TS/TSX
  restaurados aprovado após ajustar somente a formatação de ProductCard e
  ProductEditor. Build do cliente/SSR/Nitro concluído com exit 0; permanecem os
  avisos não fatais de dependências já conhecidos. javac independente --release 21
  compilou as 35 fontes principais/testes com exit 0 e aviso de Unsafe do Lombok.
  Nenhuma suíte de testes criada/executada. Home e /produtos retornaram HTTP 200
  na prévia 127.0.0.1:8081. git diff --check aprovado; nenhuma referência de
  subcategoria/taxonomy permanece nas fontes frontend ou Java de produção.
- Limitação: sem inspeção visual/E2E do navegador nesta sessão. O servidor Java em
  execução pode precisar reiniciar para adotar as fontes restauradas; isso não
  impede o frontend de ocultar as subcategorias na prévia com atualização do Vite.
- Revisão de segredos: Gitleaks sem ocorrências na cópia dos 30 arquivos
  públicos pendentes. Credenciais, envs, logs/builds e arquivos próprios da raiz
  foram excluídos da seleção.
- GitHub: sem staging, commit ou push. Publicação continua dependendo de aprovação
  explícita para a seleção completa, mensagem e destino. Dados privados, logs,
  builds e arquivos próprios do usuário na raiz continuam excluídos.

### 2026-10-21 — 019 — Animação mais presente e suave nas categorias

- Pedido: fazer os ícones aparecerem ao passar o mouse por cada categoria, com
  animação intuitiva e chamativa de intensidade moderada.
- Implementação: ajustado somente o CSS compartilhado do CatalogHeader, usado na
  home e no catálogo. Em desktop, avatar passou de 36 para 46 px, com base circular
  clara azul/dourada e sombra leve. Entrada de 440 ms combina opacidade, deslocamento
  de 14 px e escala de 0,74 até 1, com acomodação breve de 5% e rotação até 3 graus.
  Texto desloca suavemente dentro do botão, sem alterar a largura das categorias;
  altura da faixa desktop passa de 69 para 80 px para acomodar desenho e texto.
  Fundo azul claro, borda interna e traço dourado reforçam a categoria sob o ponteiro.
- Animais: orelhas, asas, cauda, bolhas, bola e coelho fazem gestos curtos e param;
  removidos os loops infinitos anteriores. A categoria Todos ganhou gesto da pata.
  Cada entrada por hover/foco reinicia a saudação. Foco visível de teclado recebe
  o mesmo efeito e contorno; SVGs continuam decorativos e nomes permanecem intactos.
- Responsividade: ícones seguem visíveis ao lado do texto em celular. Em telas
  grandes de toque, ilustrações também ficam visíveis sem depender de hover.
  prefers-reduced-motion mantém a supressão das animações e transições.
- Arquivos desta tarefa: Dogmania-Catalogo/src/styles.css e este relatório único.
  Sem alterações em componentes, dados, dependências, autenticação ou banco.
- Verificações: Prettier executado no CSS; build Vite do cliente/SSR/Nitro aprovado
  com exit 0. Permanecem avisos não fatais já conhecidos do bundler/dependências.
  git diff --check aprovado; home e /produtos retornaram HTTP 200 na prévia local.
  Revisado o diff específico contra a cópia da entrega 018: alterações limitadas
  aos estilos da faixa de categorias e seus keyframes; nenhum componente alterado.
- Limitação: sem inspeção visual/E2E no navegador nesta sessão; a intensidade foi
  calibrada pelos tamanhos, duração e deslocamentos no CSS. Nenhuma suíte de testes
  foi adicionada ou executada.
- GitHub: sem staging, commit ou push; publicação depende de aprovação explícita.
  Seleção pública de 30 arquivos pendentes revisada com Gitleaks sem ocorrências;
  credenciais, envs, logs, builds e arquivos próprios da raiz excluídos.

### 2026-10-21 — 020 — Correção do hover em prévias estreitas

- Pedido: usuário informou que a animação parecia não ter mudado.
- Diagnóstico em leitura: servidor da porta 8081 executa o Vite da pasta real na
  Área de Trabalho. GET /src/styles.css com Accept text/css retorna o CSS novo;
  GET /produtos retorna HTTP 200 e os nove catalog-pet-avatar no HTML. O efeito de
  entrada do avatar da entrega 019 estava condicionado a min-width: 1024px. Abaixo
  disso os ícones já eram estáticos, embora houvesse gestos internos, explicando
  uma limitação concreta compatível com o sintoma. A largura real da janela e as
  preferências de entrada do usuário não foram medidas; não afirmar causa visual
  confirmada nem problema de cache sem evidência.
- Correção: nova regra para até 1023 px, hover disponível e ponteiro preciso.
  Avatar de 40 px surge pela lateral com fade/escala; nome desliza 20 px em 340 ms.
  Botões de 60 px mantêm dimensões estáveis durante o hover, evitando deslocar as
  categorias vizinhas. Fundo azul e traço dourado reforçam o foco. Os gestos curtos
  existentes funcionam também nesse layout. Desktop largo mantém entrada superior;
  toque mantém desenhos visíveis e redução de movimento segue respeitada.
- Arquivos: Dogmania-Catalogo/src/styles.css e este relatório único. Nenhum dado,
  backend, conta ou dependência foi alterado; sem alteração de configurações do PC.
- Verificações: Prettier no CSS; build cliente/SSR/Nitro aprovado com exit 0, com
  avisos não fatais de dependências já conhecidos. git diff --check aprovado.
  Confirmada em resposta HTTP text/css a regra compilada width <= 1023px com
  hover/pointer: fine e min-height: 60px. HTML contém a navegação e nove ícones.
- Limitação: habilidade computer-use lida, mas o node_repl necessário não está
  exposto nesta sessão. Nenhuma automação alternativa de interface foi executada;
  não houve inspeção visual nem testes automatizados adicionados/executados.
- GitHub: sem staging, commit ou push; segue necessária aprovação explícita.
  Revisão de segredos dos arquivos públicos pendentes concluída antes da entrega.

### 2026-10-21 — 021 — Animação lateral baseada no vídeo de referência

- Pedido: reproduzir nas categorias a animação do vídeo VID_20261021_005917.mp4.
- Referência observada: vídeo local de 15,81 s, 1920x1080. Foram extraídos 18
  quadros com Chrome headless/canvas, sem transmitir o arquivo. A sequência mostra
  o animal aparecendo/crescendo à esquerda do nome, alinhado ao texto, com mudança
  de cor e linha inferior. Quadros, folha de contato e auxiliares ficam somente em
  .tools/reference-video, ignorada pelo Git; o vídeo original não foi alterado.
- Implementação: CSS compartilhado substitui os efeitos das entradas 019/020 por
  revelação lateral na mesma linha do nome, sem círculo, sombra, fundo de cartão
  ou subida do texto. A largura do espaço do ícone e sua margem abrem em 420 ms;
  opacity e transform de escala 0,25 até 1 e rotação de -14 até 0 usam transição
  de 520 ms com acomodação suave. Texto muda para dourado escuro e a linha cresce.
  Os animais próprios em SVG são reutilizados; não foram copiados assets de terceiros.
- Layout: header desktop fica com faixa de 64 px; ícones em caixas de 40 px, ou
  32 px entre 1024 e 1279 px para acomodar os rótulos. Em painéis estreitos com
  mouse, cada categoria mede 146 px e mantém sua posição durante a entrada do
  ícone; a própria faixa permite rolagem. Em dispositivos de toque, os desenhos
  continuam estáticos ao lado dos nomes. Mantidos foco por teclado, aria-pressed,
  gestos curtos dos animais e supressão de movimento por preferência do sistema.
- Arquivos: Dogmania-Catalogo/src/styles.css e este relatório único. Componentes,
  rotas, produtos, banco, autenticação e dependências não foram modificados.
- Conferências: Prettier e git diff --check aprovados; build cliente/SSR/Nitro
  aprovado com exit 0, mantendo avisos não fatais conhecidos das dependências.
  Inspeção visual por capturas reais do Chrome isolado em 1440, 1024 e 900 px com
  hover em Cachorro, e 390 px com toque: ícone lateral/texto alinhados; no celular,
  desenhos visíveis e rolagem de categorias preservada. Nas quatro larguras,
  documentElement.scrollWidth coincidiu com innerWidth, sem transbordamento da página.
  Capturas de estado inicial e hover estão no auxiliar ignorado. Não foi criada
  nem executada suíte de testes; as capturas são uma revisão visual da implementação.
- Limites: a inspeção não cobriu todas as categorias/interações nem a janela aberta
  pelo usuário. O comportamento visual da referência foi adaptado à marca Dogmania;
  não afirmar reprodução pixel a pixel ou cobertura E2E completa.
- GitHub: sem staging, commit ou push. Seleção pública de 30 arquivos pendentes
  revisada com Gitleaks sem ocorrências antes da entrega. Credenciais, envs, vídeo,
  capturas, auxiliares e arquivos próprios do usuário na raiz excluídos.

### 2026-10-21 — 022 — Mini bounce no ícone ao passar o mouse

- Pedido: adicionar animação de bounce ao animal quando o ícone aparece no hover.
- Implementação: CSS catalog-icon-bounce aplicado ao wrapper catalog-pet-avatar,
  cobrindo o desenho inteiro em todas as categorias. Movimento único de 620 ms,
  atraso de 80 ms, salto de 7 px, acomodação de 1 px para baixo e retorno de 2 px
  antes do repouso. Usa translate independente do transform da entrada lateral,
  preservando crescimento/rotação e a posição do texto. Recomeça ao sair e entrar
  novamente no botão; foco visível recebe o mesmo efeito. Não há repetição infinita.
- Coelho: removido somente o salto anterior do SVG raiz para não somar dois saltos
  sobre o mesmo animal. Demais gestos internos continuam. Efeito restrito a mouse
  com hover/ponteiro preciso e sem preferência por redução de movimento; em toque,
  os ícones permanecem visíveis. Sem alteração de largura, altura ou layout dos botões.
- Arquivos: Dogmania-Catalogo/src/styles.css e este relatório único. Nenhuma mudança
  em componentes, APIs, produtos, banco, credenciais, dependências ou rotas.
- Conferências: Prettier e build cliente/SSR/Nitro aprovados (exit 0), com avisos
  não fatais de dependências já conhecidos. git diff --check aprovado. Revisão
  visual em Chrome isolado a 1280 px por capturas sincronizadas com a renderização:
  wrapper em y=117 px no ápice e y=124 px em repouso; deslocamento de 7 px confirmado.
  prefers-reduced-motion: reduce resultou em animation-name: none. Capturas e auxiliar
  ficam em .tools/category-bounce, ignorada pelo Git; nenhuma suíte de testes criada
  ou executada. A revisão pontual não cobre todos os dispositivos/categorias.
- GitHub: sem staging, commit ou push. Seleção de 30 arquivos públicos pendentes
  revisada com Gitleaks sem ocorrências; credenciais, envs, auxiliares, capturas,
  builds/logs e arquivos próprios do usuário na raiz excluídos. Publicação continua
  dependendo de aprovação explícita do usuário.

### 2026-10-21 — 023 — Bounce separado da entrada e conferência em 1920x1200

- Pedido: usuário relatou ausência de mudança e perguntou se 1920x1200 interfere;
  esclareceu que o ícone aparece, mas não pula. A resolução física não corresponde
  necessariamente à área CSS da prévia e não há condição máxima que bloqueie o
  bounce nessa resolução. Não afirmar diagnóstico da janela pessoal sem medi-la.
- Diagnóstico: servidor retorna HTML/CSS atuais com catalog-icon-bounce. Chrome
  isolado em 1920x1200, sem forçar preferência de movimento, informou hover=true,
  pointer fine=true, reduce=false e animação ativa. O bounce anterior compartilhava
  o elemento que ainda crescia; a subida de 7 px ocorria durante a revelação, o que
  podia reduzir sua percepção. Isso é uma limitação da composição, não comprovação
  da causa específica no navegador do usuário. Reduce continua podendo suprimi-lo.
- Ajuste: CatalogHeader ganhou span catalog-pet-motion decorativo dentro de
  catalog-pet-avatar. Entrada lateral/escala fica no elemento externo; desenho
  interno usa transform: translateY, sem depender da propriedade individual
  translate. Bounce de 600 ms começa após 280 ms: sobe 10 px, acomoda 1 px abaixo,
  retorna 3 px para cima e repousa. O salto principal ocorre com o animal já
  praticamente revelado. Uma execução por hover/foco; sem mudança de texto/filtros.
- Acessibilidade/responsividade: wrapper externo com aria-hidden=true; SVG continua
  decorativo. Preferência de reduzir movimento, foco por teclado e ícones visíveis
  em toque preservados. Dimensões dos botões e número de categorias mantidos.
- Arquivos: Dogmania-Catalogo/src/components/CatalogHeader.tsx, src/styles.css e
  este relatório único. Sem alterações em produtos, backend, banco ou dependências.
- Conferências: Prettier, TypeScript --noEmit, ESLint do componente e build
  cliente/SSR/Nitro aprovados, exit 0; avisos conhecidos de dependências permanecem.
  Chrome isolado em 1920x1200: amostragem natural de 44 quadros observou deslocamento
  até -7,34 px, acomodação de +0,98 px e repouso em 0; o pico exato de -10 px foi
  posicionado e inspecionado nas capturas com a animação pausada. Reduce resultou
  em animation-name:none. Capturas e auxiliares em .tools/category-bounce ignorada.
  git diff --check e revisão Gitleaks dos 30 arquivos públicos pendentes aprovados.
  Nenhuma suíte de testes foi adicionada/executada; conferência visual pontual.
- Limitação: não foi inspecionada a janela embutida do usuário nem suas preferências
  reais. Não atribuir o relato à resolução, cache ou acessibilidade como causa certa.
- GitHub: sem staging, commit ou push; aprovação explícita continua necessária.
  Credenciais, envs, capturas, auxiliares, builds/logs e arquivos próprios da raiz
  excluídos da seleção pública.

### 2026-10-21 — 024 — Animação das categorias ativa com redução de movimento

- Pedido: usuário confirmou que passou a funcionar e solicitou expressamente que
  a animação funcione mesmo com redução de movimento ativada, de forma global.
- Escopo: comportamento compartilhado de categorias em todos os usos de
  CatalogHeader, atualmente home e catálogo. A página de detalhe usa SiteHeader
  e não ganhou uma nova faixa de categorias nesta tarefa.
- Implementação: retiradas as condições prefers-reduced-motion:no-preference
  que impediam o bounce e os gestos dos animais. As regras globais de duração
  reduzida e a regra do header excluem .catalog-category e seus descendentes e
  pseudo-elementos; assim entrada, crescimento, traço, cores, bounce e gestos
  preservam suas durações também com reduce. Demais elementos continuam com suas
  regras existentes de redução de movimento. Não foram alteradas preferências
  do sistema/navegador, contas, banco ou dependências.
- A decisão de manter esse movimento independentemente da preferência do visitante
  é uma exceção solicitada explicitamente pelo usuário nesta entrada, superando
  o comportamento descrito nas entregas anteriores. Em toque, os ícones continuam
  visíveis, com hover/bounce condicionado à interação com mouse/ponteiro preciso.
- Arquivos: Dogmania-Catalogo/src/styles.css e este relatório único.
- Conferências: Prettier e build cliente/SSR/Nitro aprovados (exit 0), mantendo
  avisos não fatais conhecidos das dependências. git diff --check aprovado.
  Chrome isolado a 1920x1200, em / e /produtos, com reduce explicitamente em true:
  animação catalog-icon-bounce ativa, duração 0,6 s; frame de ápice em translateY
  -10 px; transições de entrada 0,42/0,42/0,18/0,52 s e orelhas com 0,82 s.
  Captura do catálogo revisada visualmente; auxiliares/capturas permanecem em
  .tools/category-bounce ignorada. Nenhuma suíte de testes criada ou executada.
- GitHub: sem staging, commit ou push. Revisão Gitleaks sem ocorrências nos 30
  arquivos públicos pendentes; dados privados, envs, auxiliares, capturas, builds,
  logs e arquivos próprios do usuário na raiz excluídos. Publicação segue sujeita
  à aprovação explícita do usuário.

### 2026-10-21 — 025 — Dropdowns ancorados e links para subcategorias

- Pedido: dropdown abaixo de cada categoria ao passar o mouse, com subcategorias
  da imagem e redirecionamento ao clicar. Este pedido reintroduz explicitamente a
  funcionalidade retirada na entrada 018, preservando o visual e bounce posteriores.
- Design: painel branco de 360 px alinhado ao botão, borda superior dourada, lista
  vertical com setas e Ver todos os produtos. Cachorro inclui exatamente as 16 opções
  da imagem, incluindo Adestramento e Comportamento, Raças e Marcas. Gatos, Pássaros,
  Peixes, Outros Pets, Rações, Higiene e Brinquedos possuem listas correspondentes;
  Todos mantém acesso direto ao catálogo completo. Sem submenu de terceiro nível.
- Interação: estado por categoria; portal fixo evita corte pelo scroll horizontal.
  Posição respeita bordas da janela e altura disponível, com rolagem interna. Mouse
  abre no hover e mantém aberto ao mover para a lista (atraso de saída de 180 ms).
  Clique/toque abre; segundo toque/acionamento por teclado alterna; botão de fechar,
  Escape, clique externo, saída de foco e scroll/resize externo fecham. ArrowDown
  abre e foca o primeiro link; Escape devolve foco ao botão. Recuperação por
  pointermove cobre entrada do ponteiro ocorrida antes da hidratação do frontend.
  aria-expanded/controls e links nativos preservam navegação de teclado.
- Animação: data-menu-open mantém o animal e o realce enquanto o painel estiver
  aberto. Bounce da entrada 024, inclusive com reduce=true, foi preservado.
- Navegação: links nativos TanStack para /produtos?categoria=...&subcategoria=...
  e hash catalog-results, preservando busca quando preenchida. URL valida a relação
  categoria/subcategoria. Catálogo filtra pelos valores persistidos, mostra o título
  e um chip que limpa só a subcategoria. Subcategorias sem itens mostram estado vazio.
  taxonomy.ts foi reaproveitada da entrada 017 e ampliada com os três rótulos novos.
  Relações por chaves explícitas incluem, por exemplo, Cachorro > Ração e o produto
  salvo em Rações > Ração para cães; sem inferência por palavras no nome.
- Administração/API: campo opcional de subcategoria no editor, lista conforme a
  categoria e reinício ao trocá-la; edição preserva valores desconhecidos já salvos.
  Modelo TS, Product, ProductDTO e ProductService receberam novamente subcategory;
  DTO valida 2–80 caracteres quando preenchido, serviço normaliza e mapeia CRUD.
  API valida comprimento; vocabulário/combinações são controlados pelo frontend.
  Raças/Marcas são rótulos de classificação, sem novos cadastros ou conteúdo editorial.
- Banco: nenhuma DDL, migration, seed, credencial ou escrita em produtos executada.
  Reutilizada a coluna já existente. API local adotou as fontes atualizadas via
  compilação/DevTools; GET confirmou seis produtos públicos e cinco classificados.
  Dados, contas, estoque, privilégios e o produto não classificado preservados.
- Arquivos: frontend CatalogHeader, CatalogGrid, routes/produtos, model, taxonomy,
  ProductEditor e styles; Java Product, ProductDTO e ProductService; READMEs backend
  e Supabase; este relatório único. Home usa automaticamente o cabeçalho compartilhado.
- Conferências: Prettier, TypeScript --noEmit e ESLint dos seis arquivos TS/TSX
  aprovados. Build final cliente/SSR/Nitro aprovado (exit 0); avisos não fatais de
  dependências permanecem. Maven compile offline aprovado sem executar testes;
  primeira chamada corrigida após interpretação incorreta de argumento pelo
  PowerShell. javac independente --release 21 compilou as 35 fontes principais/testes
  com exit 0; avisos de Unsafe/Lombok/JDK permanecem. git diff --check aprovado.
- Revisão no navegador: captura Chrome 1920x1200 com reduce=true mostra menu de
  Cachorro com 16 links, painel x=481/y=180, largura 360 e altura 801; ponteiro
  atravessou para Ração mantendo o menu aberto. Clique abriu URL da subcategoria,
  título Cães · Ração e um produto real. Na home, ArrowDown abriu o menu Gato e
  focou Ver todos; Escape fechou e retornou foco a Gato. Celular 390x844 com toque:
  painel dentro da janela (x=18, largura360, altura591,5), página sem overflow
  horizontal; clique em Brinquedos abriu filtro Cães · Brinquedos com um produto.
  Capturas desktop/menu, resultado e mobile revisadas; auxiliares em
  .tools/category-dropdown ignorada. Primeira captura foi refeita após aguardar
  hidratação completa; nenhum teste automatizado/suíte foi criado ou executado.
- Limites: sem novo cadastro ou alteração via CRUD nesta tarefa; revisão não cobre
  todas as categorias, navegadores ou combinações. Valores novos sem produtos
  explicitamente classificados continuarão vazios até o administrador classificá-los.
- GitHub: nenhum staging, commit ou push. Gitleaks sem ocorrências nos 34 arquivos públicos
  selecionados. Revisão de segredos dos arquivos públicos
  pendentes concluída antes da entrega; credenciais, envs, capturas, auxiliares,
  builds/logs e arquivos próprios do usuário na raiz excluídos. Publicação depende
  de aprovação explícita para a seleção, mensagem e destino.

### 2026-10-21 — 026 — Clique na categoria restaurado e dropdown simplificado

- Pedido: manter clique na categoria funcionando como Ver todos os produtos, sem
  perder o dropdown; retirar do dropdown Cachorro, Ver todos os produtos,
  Adestramento e Comportamento, Raças e Marcas.
- Navegação: onClick do botão principal volta a chamar onCategoryChange para
  qualquer categoria, fechando o menu. O callback existente abre /produtos na
  home e atualiza categoria no catálogo, limpando subcategoria. Mantida a busca
  como no comportamento anterior e no link Ver todos que foi removido. Mouse
  continua abrindo o dropdown no hover; ArrowDown continua abrindo por teclado.
- Conteúdo: removidos o título visível da categoria e a faixa Ver todos de todos
  os painéis. As três opções finais de Cães foram retiradas da taxonomy, deixando
  13 subcategorias e mantendo o primeiro item Ração. Removidos os estilos sem uso
  dos cabeçalhos/faixa; a identificação acessível do painel por categoria permanece.
- Celular/toque: nome da categoria também navega diretamente. Seta separada com
  área de 44x44 px abre/fecha o dropdown e indica o estado expandido. A faixa de
  categorias mantém rolagem e não mistura navegação com abertura por toque.
  Hover, links de subcategoria, Escape, fechamento externo e bounce preservados.
- Arquivos: CatalogHeader.tsx, features/products/taxonomy.ts, styles.css no frontend
  e este relatório único. Sem mudanças em banco, backend, dependências ou produtos.
  Valores de subcategoria que eventualmente já existam no banco não foram apagados;
  o editor continua preservando valores desconhecidos em produtos já cadastrados.
- Conferências: Prettier, TypeScript --noEmit, ESLint dos dois TS/TSX e build
  cliente/SSR/Nitro aprovados, exit 0; avisos não fatais de dependências já conhecidos.
  git diff --check aprovado e busca nas fontes confirmou ausência dos blocos antigos
  e dos três rótulos removidos. Nenhuma suíte de testes foi criada ou executada.
- Revisão visual/interação em navegador isolado: em 1920x1200 com reduce=true,
  clique em Cachorro a partir do filtro Ração retirou subcategoria da URL e mostrou
  Produtos · Cães, com quatro produtos disponíveis. Hover reabriu lista com 13
  links, sem título/Ver todos/itens removidos. Clique em Ração continuou abrindo
  Cães · Ração. Na home, clique em Gato abriu /produtos?categoria=Gatos.
  Em 390x844 com toque, nome Cachorro navegou sem abrir painel; seta abriu as 13
  opções dentro da janela (x=18, largura360, altura584), sem overflow da página;
  link Brinquedos abriu a subcategoria correta. Capturas desktop/mobile revisadas
  e auxiliares em .tools/category-click ignorada. Revisão pontual, sem cobertura E2E
  completa ou novas escritas via CRUD.
- GitHub: sem staging, commit ou push. Seleção de arquivos públicos pendentes
  revisada com Gitleaks antes da entrega, sem ocorrências; credenciais, envs,
  capturas, auxiliares, builds/logs e arquivos próprios do usuário na raiz excluídos.
  Publicação continua exigindo aprovação explícita do usuário.

### 2026-10-21 — 027 — Escurecimento do conteúdo sob o header com dropdown aberto

- Pedido: escurecer a área abaixo do header quando o dropdown aparecer, conforme
  a imagem de referência, mantendo cabeçalho e lista de subcategorias claros.
- Implementação: backdrop decorativo no mesmo portal do painel, fixo até as bordas
  da janela e com background preto a 52% de opacidade. Topo calculado pela borda
  inferior real do header ao abrir; o dropdown passa a iniciar nessa mesma borda.
  Backdrop em z-index 50, painel em 60, header em 40 fora da área coberta. Entrada
  por fade de 160 ms, respeitando a regra geral de reduzir movimento da página.
- Interação: a camada acompanha o estado do menu e é removida ao fechá-lo. Clique
  na área escura é tratado pelo fechamento externo já existente; o conteúdo atrás
  não recebe o clique. Mantidos hover, clique da categoria, seta no toque, links,
  Escape e bounce dos ícones. Scroll/resize externo continua fechando o menu para
  impedir posição desatualizada do painel ou backdrop.
- Arquivos: frontend CatalogHeader.tsx, styles.css e este relatório único. Sem
  alterações em filtros, dados, banco, backend, credenciais ou dependências.
- Conferências: Prettier, TypeScript --noEmit, ESLint do componente e build final
  cliente/SSR/Nitro aprovados (exit 0); avisos conhecidos de dependências mantidos.
  git diff --check aprovado. Capturas Chrome revisadas em 1920x1200 e 390x844:
  bordas inferiores do header, início do backdrop e topo do painel coincidiram
  em 182 px no desktop e 249,5 px no celular. Cor rgba(0,0,0,0.52), ordem de camadas
  e legibilidade branca do header/painel conferidas. Clique/toque na área escura
  removeu backdrop e painel nos dois casos. Auxiliares/capturas em
  .tools/category-backdrop ignorada. Sem suíte de testes adicionada/executada;
  revisão visual pontual não equivale a cobertura completa de navegadores/dispositivos.
- GitHub: sem staging, commit ou push. Revisão Gitleaks sem ocorrências na seleção
  pública pendente; dados privados, envs, capturas, auxiliares, builds/logs e arquivos
  próprios do usuário na raiz excluídos. Publicação exige aprovação explícita.

### 2026-10-21 — 028 — Entrada e saída mais suaves do escurecimento

- Pedido: prolongar e suavizar o escurecimento ao abrir e retirar o mouse, pois
  a entrada e a saída estavam rápidas demais.
- Causa no código: a camada era criada com keyframes de 160 ms na entrada e
  desmontada imediatamente ao fechar, sem possibilidade de fade de saída. A
  regra geral de reduce ainda encurtava sua duração, mesmo com o bounce liberado.
- Ajuste: portal decorativo passa a permanecer montado após hidratação. data-open
  controla opacity/visibility com transições de 520 ms na entrada e 480 ms na saída,
  usando cubic-bezier(0.4,0,0.2,1). A visibilidade só é ocultada após o fade; ao
  fechar, pointer-events:none libera imediatamente a navegação abaixo. Retorno
  rápido do ponteiro reverte a partir da opacidade atual no mesmo elemento, sem
  reiniciar o escurecimento. Mantida a intensidade máxima preta de 52%.
- Hover: tolerância de fechamento aumentou de 180 para 280 ms, cancelada quando
  o mouse retorna à categoria ou entra no painel. Troca entre categorias mantém
  o mesmo backdrop, sem novo flash. Clique externo, Escape, links e scroll/resize
  continuam fechando o menu. O dropdown mantém sua desmontagem ao fechar; apenas
  o escurecimento continua sua saída gradual.
- Preferência global: backdrop foi incluído na exceção à regra de duração reduzida
  para cumprir o pedido anterior de manter essas animações e a suavidade atual
  também com reduce=true. Não foram alteradas configurações do navegador/Windows
  nem outras animações fora das categorias e dessa camada. Portal só é criado no
  cliente após montagem, preservando o primeiro render SSR/hidratação.
- Arquivos: frontend CatalogHeader.tsx, styles.css e este relatório único.
  Sem alterações de produtos, filtros, dados, banco, backend ou dependências.
- Conferências: Prettier, TypeScript --noEmit, ESLint do componente e build final
  cliente/SSR/Nitro aprovados, exit 0; avisos conhecidos de dependências mantidos.
  git diff --check aprovado. Chrome isolado em 1920x1200 com reduce=true: opacidade
  intermediária de entrada ~0,18, aberta 1; após sair, permaneceu aberta no intervalo
  de tolerância; saída com opacidade intermediária ~0,78 e pointer-events:none.
  Reentrada durante a saída partiu de ~0,43 e chegou a 1 com o mesmo nó DOM.
  Clique externo iniciou saída gradual; estado final opacity0/visibility:hidden.
  Em 390x844 com toque e reduce=true, transição permaneceu em 0,52 s com opacidade
  intermediária observada. Captura de saída e auxiliares em
  .tools/category-backdrop-fade ignorada. Sem suítes de testes adicionadas/executadas;
  revisão pontual não representa cobertura E2E completa.
- GitHub: sem staging, commit ou push. Gitleaks sem ocorrências na seleção pública
  pendente; envs, credenciais, auxiliares, capturas, builds/logs e arquivos próprios
  do usuário na raiz excluídos. Publicação continua exigindo aprovação explícita.

### 2026-10-21 — 029 — Publicação consolidada solicitada no GitHub

- Pedido: subir tudo ao repositório Git. Destino: GustavoKenz0/DogMania-Catalogo,
  origin/main. Mensagem proposta: Atualiza catálogo, navegação e configuração local da Dogmania.
  A preparação dos arquivos está concluída. A tentativa de commit foi bloqueada
  antes da execução pela revisão automática de aprovação, que entendeu ser necessária
  confirmação específica após apresentar seleção, mensagem e destino, conforme
  AGENTS.md. Nenhum commit ou push executado nesta entrega; aguardando essa confirmação.
- Conteúdo: todas as alterações públicas pendentes desde 911eab6, incluindo home,
  header, busca, categorias/subcategorias, bounce, dropdowns e escurecimento com
  transição suave; ajustes Java/Lombok/editor; launcher local; migration aditiva
  já existente; exemplos/ferramentas operacionais e documentação/histórico único.
  package.json/package-lock.json da raiz, antes fora da seleção por pertencerem
  ao usuário, foram agora revisados e incluídos no pedido de subir tudo: contêm
  somente manifesto/lock de dependências Supabase, sem scripts ou credenciais.
- Revisão: os 34 arquivos da última cópia revisada coincidiram integralmente com
  os arquivos atuais antes desta entrada. As validações registradas na entrada
  028 (TypeScript, lint, build e conferência pontual no navegador) continuam
  correspondendo a essas fontes; não foi executada nova suíte de testes nesta
  preparação. Os dois JSONs da raiz foram lidos e analisados sintaticamente.
  git diff --check aprovado. Nenhum caminho privado/gerado está rastreado.
- Segurança: .private, envs reais, .tools, dependências instaladas, saídas de build,
  logs, certificados e banco local permanecem fora do envio. Conferido por
  git check-ignore. Documento de acessos não foi aberto nem copiado. Todo o
  conteúdo público selecionado para a árvore Git foi revisado com Gitleaks.
- Estado remoto anterior: origin/main e HEAD local apontavam para
  911eab6b3dd47c5828675b1b9053b63bd54ea014 na consulta ls-remote, sem divergência.
  Após aprovação específica, o envio será normal, sem force push, rebase ou alteração
  de histórico publicado. O bloqueio da revisão automática não foi contornado.
- Registro: este arquivo é salvo antes do commit/push para integrar a própria
  publicação. Confirmar o resultado final pelos commits/refs locais e remotos
  e pelo comprovante informado ao usuário; esta preparação não é prova de push.
- Revisão final: Gitleaks sem ocorrências nos 141 arquivos públicos completos;
  36 arquivos alterados/novos na seleção. Arquivos privados permanecem excluídos.

### 2026-10-21 — 030 — Aprovação explícita do commit e push consolidados

- Usuário respondeu "aprovar" à confirmação dos 36 arquivos, mensagem
  "Atualiza catálogo, navegação e configuração local da Dogmania" e destino
  GustavoKenz0/DogMania-Catalogo, origin/main. Aprovação válida para este envio.
- Antes de executar, árvore do índice, HEAD base, branch e URL de push coincidiram
  com a seleção revisada da entrada 029. Nenhuma alteração fora do índice foi
  encontrada. Este registro acrescenta somente a aprovação ao relatório único;
  não muda código nem amplia o conteúdo funcional aprovado.
- Revisão de segredos integral repetida após este registro; diff preparado sem
  problemas de whitespace. Senhas, envs, .private, .tools, logs, dependências
  instaladas e builds permanecem fora do commit. Nenhum novo teste executado.
- Procedimento autorizado: criar o commit com a mensagem aprovada e fazer push
  normal para origin/main, sem reescrever histórico publicado. Este relatório é
  incluído no próprio commit; o resultado final deve ser confirmado pelo SHA do
  commit, refs remotas e comprovante no chat, pois o arquivo é salvo antes do push.

<!-- Próximas entradas: usar data real America/Sao_Paulo e próximo número sequencial.
Registrar pedido; alterações/motivos; arquivos; verificações/resultados; pendências.
Não registrar segredos. Preservar o histórico e atualizar as seções de estado atual. -->
