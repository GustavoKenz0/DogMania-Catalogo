# Dogmania API

API Java 21 / Spring Boot 3.5.16, com PostgreSQL via JDBC. O navegador fala com esta API; não acessa tabelas administrativas diretamente pelo Supabase REST.

Dependências atualizadas dentro das linhas compatíveis: Springdoc 2.8.17 e JJWT 0.12.7. Versões consultadas nos metadados oficiais do Maven Central. Atualizações reduzem exposição a problemas conhecidos, mas não substituem uma auditoria de dependências transitivas e os testes de integração.

## Executar

### Configuração local no Windows

Na pasta real `backend-api/`, execute:

```powershell
.\configure-local.ps1
.\start-local.ps1
```

O configurador solicita a URL JDBC e usuário do Supabase, lê senhas sem exibi-las,
gera um segredo JWT aleatório e cria `.env.local` com ACL restrita ao usuário atual
e SYSTEM. O arquivo é ignorado pelo Git. Não use a cópia `.tools/publish-review/`.
Nenhuma migration remota é executada por esses comandos; prepare o banco conforme
`../supabase/README.md` antes de iniciar a API.

### Assistente após aplicar as migrations no Supabase

Em projeto novo, com as duas migrations já aplicadas, é possível habilitar a role
restrita e preparar o arquivo local em um único fluxo:

```powershell
.\setup-supabase.ps1 -PoolerHost 'HOST_DO_SESSION_POOLER' -ProjectRef 'IDENTIFICADOR_DO_PROJETO'
.\start-local.ps1
```

Execute em um terminal interativo PowerShell do VS Code ou Windows Terminal.
O assistente solicita a senha PostgreSQL escolhida ao criar o projeto, conecta
como `postgres.PROJECT_REF`, confere schema/RLS e os atributos da role, e pede
uma senha diferente para `dogmania_api`, com confirmação. O driver gera o
verificador SCRAM-SHA-256 antes do envio do comando de alteração de senha.
Somente o login e a senha da role existente são alterados; grants e tabelas são
preservados. A role não pode estar previamente habilitada nem ser privilegiada.

A conexão da role é conferida antes da configuração local. Na etapa 2, informe
novamente a senha exclusiva de `dogmania_api`, escolha se deseja criar o primeiro
administrador e preencha os dados dele. A senha `postgres` não é gravada em arquivo,
argumentos ou variáveis de ambiente. O backend usa somente a credencial restrita.

O assistente usa o driver PostgreSQL gerenciado pelo Spring Boot deste backend,
já baixado no cache Maven padrão; não instala ferramentas. O launcher de código
fonte Java exige JDK 21 ou superior. TLS usa `verify-full` e `sslrootcert`.
O helper `local-security.ps1` baixa por HTTPS o certificado CA público da
distribuição oficial usada pelo painel Supabase e o guarda em
`.private/supabase-prod-ca-2021.crt`. O caminho é passado ao driver; nenhuma
confiança global do Windows/Java é alterada e a verificação TLS permanece ativa.

O assistente recusa sobrescrever `.env.local` ou trocar uma senha já provisionada.
Se a role já foi habilitada, use `configure-local.ps1 -DatabaseUrl 'URL_JDBC_TLS'
-DatabaseUser 'dogmania_api.PROJECT_REF'` com a senha escolhida anteriormente.
Uma falha de conexão depois do commit da role não desfaz sua senha: a mensagem
informa esse estado para evitar uma rotação involuntária. O assistente não aplica
migrations, seed ou Storage e não inicia o servidor automaticamente.

### Configuração com documento privado de acessos

Quando solicitado pelo responsável, o fluxo alternativo gera as novas senhas e
grava um documento privado com os acessos:

```powershell
.\complete-local.ps1 -PoolerHost 'HOST_DO_SESSION_POOLER' -ProjectRef 'IDENTIFICADOR_DO_PROJETO' -AdminEmail 'EMAIL_DO_RESPONSAVEL'
```

Ele pede somente a senha PostgreSQL existente no terminal, gera senhas aleatórias
distintas para a role e o administrador, e registra os acessos em
`.private/ACESSOS_DO_SISTEMA.local.txt`. Esse documento contém senhas legíveis,
inclusive a de operador informada pelo responsável. Ele é ignorado pelo Git;
a pasta, o documento e os temporários recebem DACL restrita ao usuário atual e
SYSTEM, sem herança. A proteção é aplicada com `icacls` e conferida antes de
gravar segredos. Isso não é criptografia do conteúdo.

O helper Java pode receber um caminho de arquivo local de requisição com segredos
codificados em base64; base64 não é criptografia. O arquivo é protegido antes da
gravação, nunca é enviado ao Git e é removido ao terminar a execução. Senhas não
passam em argumentos de processo nem em logs. O relatório público do projeto
registra apenas os caminhos e o resultado, nunca valores privados.

`.private/setup-status.local.json` contém somente o estágio e diagnóstico sem
segredos. Se houver falha, preserve o documento gerado e confira o estágio da role;
o fluxo recusa sobrescrever arquivos ou repetir provisionamento de role já habilitada.
Após a primeira inicialização/login, desligue o bootstrap e remova sua senha do
`.env.local`. O documento privado permanece como entrega solicitada pelo usuário.

### Detalhes da execução local

Spring lê `.env.local` no formato Java properties (`CHAVE=valor`, sem aspas) quando
o diretório de execução é `backend-api/`. Variáveis de ambiente têm precedência.
Use `.\start-local.ps1 -Check` para conferir presença de configuração/ferramentas
sem conectar, ou `.\start-local.ps1 -Test` para testes isolados sem credenciais.
O launcher aceita Maven no PATH ou uma distribuição já existente no cache Maven
Wrapper do usuário. Ele não instala ferramentas nem imprime credenciais.
Ao iniciar o servidor, também usa `.tools/jtmp` como diretório de sockets Unix
do processo Java, evitando o limite de tamanho de caminhos do Windows quando o
TEMP herdado é longo. O ajuste vale somente para essa execução, sem mudar o TEMP
global ou desativar recursos de segurança.

Se scripts estiverem bloqueados, use `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1`.
Essa opção vale apenas para o processo iniciado, sem alterar a política permanente.
Bootstrap é opcional. Após o primeiro login, desative-o e remova sua senha do arquivo.

1. Instale um JDK 21 e Maven 3.9.
2. Revise e aplique as migrações em `../supabase/migrations` com uma conexão de migração. Configure separadamente a senha da role `dogmania_api`, conforme `../supabase/README.md`.
3. Defina as variáveis de `backend-api/.env.example` na IDE, no ambiente ou no `.env.local` criado pelo configurador. `.env` genérico não é carregado automaticamente. Não versione credenciais.
4. `JWT_SECRET_KEY` deve conter pelo menos 32 bytes aleatórios. Não existe segredo padrão. Conecte o banco remoto com TLS e validação do certificado (`sslmode=verify-full`, com CA confiável configurada quando necessário).
5. Execute `mvn spring-boot:run`. A porta padrão é 8080; a vitrine usa 8081.
6. Para testes isolados, execute `mvn test`. Eles não substituem validação com um banco PostgreSQL de homologação.

O Hibernate somente valida o esquema (`ddl-auto=validate`). Ele não executa migrações nem altera as tabelas automaticamente.

## Primeiro administrador

O bootstrap é opcional, sem conta ou senha de demonstração. Defina `DOGMANIA_BOOTSTRAP_ADMIN_ENABLED=true`, e-mail válido e senha de pelo menos 16 caracteres (máximo 72 bytes UTF-8). Execute uma vez e, depois, desative o bootstrap e remova a senha das variáveis. Um e-mail já existente não é atualizado nem tem sua senha trocada pelo bootstrap. Não existe endpoint público para cadastrar administradores.

## Contrato HTTP

| Método e rota | Acesso | Resultado |
| --- | --- | --- |
| POST `/api/v1/auth/login` | Público, limitado por IP | `{token,tokenType,expiresIn,userId,name,email,role}` |
| GET `/api/v1/auth/me` | ADMIN / SUPER_ADMIN | `{userId,name,email,role}` |
| GET `/api/v1/products` | Público | Página de produtos ativos |
| GET `/api/v1/products/{id}` | Público | Produto ativo; inativo retorna 404 |
| GET `/api/v1/products/{id}/related?limit=4` | Público | Até 20 relacionados ativos |
| GET `/api/v1/admin/products` | ADMIN / SUPER_ADMIN | Página incluindo produtos sem estoque |
| POST `/api/v1/products` | ADMIN / SUPER_ADMIN | Produto criado, status 201 |
| PUT `/api/v1/products/{id}` | ADMIN / SUPER_ADMIN | Atualização dos campos |
| PATCH `/api/v1/products/{id}/availability` | ADMIN / SUPER_ADMIN | Corpo `{ "active": false }` ou `true` |
| DELETE `/api/v1/products/{id}` | ADMIN / SUPER_ADMIN | Exclusão definitiva, status 204 |
| POST `/api/v1/uploads/image` | ADMIN / SUPER_ADMIN | Multipart `file`; resposta `{ "url": "https://..." }` |

Listagens recebem `q`, `category`, `page`, `size` e `sort`. O retorno segue `Page`: `content`, `totalElements`, `totalPages`, `number`, `size`. O tamanho é limitado a 100. Ordenações aceitas: `createdAt`, `updatedAt`, `name`, `price`, `category`, `sortOrder`, `id`.

Produto: `title` (até 150 caracteres, alias de entrada `name`), `description` (obrigatória, até 2000), `price` (positivo, até 8 inteiros e 2 casas decimais), `category` (até 50), `image` (URL HTTPS até 2048), `badge` (opcional, até 50) e `active`. O campo Java/banco é `name`; JSON utiliza `title` para preservar compatibilidade com a vitrine.

## Upload opcional

Revise `../supabase/setup_storage.sql` antes de criar o bucket público `product-images`. Configure `STORAGE_ENABLED=true`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no backend. São aceitos PNG, JPEG e WebP de até 5 MB, com verificação de assinatura inicial e nomes UUID gerados no servidor. SVG e arquivos base64 no produto não são aceitos. O serviço desabilitado responde 503 e o painel pode usar URL HTTPS. O upload não executa varredura antivírus nem transcodificação completa; remoção de objetos órfãos deve ser planejada separadamente.

## Segurança e operação

- JWT Bearer de uma hora por padrão, com issuer obrigatório e assinatura validada. O usuário e seu estado ativo são consultados no banco em cada requisição autenticada. Não há refresh token; após expiração, faça login novamente. Logout no cliente remove o token; revogação imediata exige desativar o administrador ou uma futura lista de revogação.
- Senhas BCrypt, respostas JSON 401/403, validação de DTOs e allowlist CORS. O browser não envia cookies de autenticação.
- Login limitado a 10 tentativas por IP em cinco minutos por instância. Em produção, use também controle compartilhado no gateway/reverse proxy; não confie em `X-Forwarded-For` arbitrário. HTTPS, monitoramento e limites de corpo/requisições devem ser configurados no proxy.
- O trigger PostgreSQL gera auditoria durável das alterações de produtos dentro da transação. A role de runtime não grava diretamente na tabela de auditoria. Logs da aplicação complementam o usuário autenticado e eventos de login; envie-os a um destino protegido. Os registros do banco identificam a conexão, não a pessoa.
- Swagger desabilitado por padrão e administrativo quando habilitado. Nenhuma configuração elimina todos os riscos; mantenha dependências atualizadas e faça revisão operacional e testes com o banco de homologação antes da publicação.
