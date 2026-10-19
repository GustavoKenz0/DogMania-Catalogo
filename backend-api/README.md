# Dogmania API

API Java 21 / Spring Boot 3.5.16, com PostgreSQL via JDBC. O navegador fala com esta API; não acessa tabelas administrativas diretamente pelo Supabase REST.

Dependências atualizadas dentro das linhas compatíveis: Springdoc 2.8.17 e JJWT 0.12.7. Versões consultadas nos metadados oficiais do Maven Central. Atualizações reduzem exposição a problemas conhecidos, mas não substituem uma auditoria de dependências transitivas e os testes de integração.

## Executar

1. Instale um JDK 21 e Maven 3.9.
2. Revise e aplique as migrações em `../supabase/migrations` com uma conexão de migração. Configure separadamente a senha da role `dogmania_api`, conforme `../supabase/README.md`.
3. Defina as variáveis de `backend-api/.env.example` na configuração de execução da IDE ou nos segredos do ambiente. Spring não lê `.env` automaticamente. Não versione credenciais.
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
