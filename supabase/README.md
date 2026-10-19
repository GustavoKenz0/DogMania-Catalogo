# Banco Dogmania / Supabase PostgreSQL

O navegador conversa exclusivamente com a API Java. O JWT de administrador emitido
pela API não é um token Supabase Auth. Portanto, as políticas antigas baseadas em
`auth.jwt().app_metadata` foram substituídas: `anon`, `authenticated` e `service_role`
não recebem acesso às tabelas da aplicação. O catálogo público também passa pelo Java.

## Preparação e migração

1. Faça backup e valide a restauração antes de alterar um banco existente.
2. Use uma conexão administrativa de migração, com TLS, fora do frontend.
3. Execute na ordem `20261019_initial_schema.sql` e
   `20261020000000_java_contract_and_access.sql`. Se a primeira já foi aplicada,
   execute apenas a segunda. Registre quais versões foram aplicadas.
4. A segunda migração é transacional e preserva os registros. Corrija duplicidades
   de e-mail sem diferenciar maiúsculas/minúsculas, hashes inválidos ou preços NaN
   caso a migração rejeite dados existentes; não corte nem apague dados para fazê-la passar.
5. `seed.sql` é opcional, exclusivo de banco vazio de desenvolvimento. Contém somente
   produtos demonstrativos e não deve ser reexecutado: não há chave natural única
   que impeça duplicação desses produtos.

A migração alinha `title` → `name`, adiciona `sort_order`, corrige os tamanhos de
colunas e converte `SUPERADMIN` para `SUPER_ADMIN`. O campo `description` permanece
`text`, preservando descrições já gravadas. O Java valida o limite para novos dados.

## Conexão do servidor

A role `dogmania_api` é criada inicialmente com `NOLOGIN`, sem senha padrão,
sem privilégios de dono, DDL, criação de roles ou bypass de RLS.
Em uma sessão administrativa segura no `psql`, habilite o login e defina a senha
de forma interativa, sem colocá-la no histórico de comandos ou no Git:

```sql
ALTER ROLE dogmania_api LOGIN;
\password dogmania_api
```

Configure apenas no ambiente do backend:

```text
SUPABASE_DB_URL=jdbc:postgresql://<host-do-projeto>:5432/postgres?sslmode=verify-full
SUPABASE_DB_USER=dogmania_api
SUPABASE_DB_PASSWORD=<segredo exclusivo deste ambiente>
```

Obtenha o endereço no painel do Supabase. Em conexões via pooler, o nome de usuário
pode incluir o identificador do projeto; use a sintaxe documentada pelo painel.
Prefira conexão direta ou session pooler para JPA. Instale a CA necessária para
`verify-full`; não desative a verificação do certificado para resolver erros de TLS.

Não use `postgres`, a senha de migração nem a chave `service_role` no runtime.
Desabilite a Data API do Supabase se não houver outro consumidor legítimo dela.
Não altere privilégios globais do schema `public` usados pelos serviços internos.

## Primeiro administrador

Não há conta nem senha compartilhada nos seeds. Use o bootstrap opt-in da API Java:

```text
DOGMANIA_BOOTSTRAP_ADMIN_ENABLED=true
DOGMANIA_BOOTSTRAP_ADMIN_EMAIL=<email-do-responsavel>
DOGMANIA_BOOTSTRAP_ADMIN_PASSWORD=<senha-forte-exclusiva>
```

Execute esse procedimento uma vez, confirme o login, remova os segredos de bootstrap
e desabilite a opção antes de manter o serviço rodando. Leia também as instruções de
bootstrap do backend. Se o seed antigo já foi executado, trate a conta de demonstração
como comprometida: desative-a ou troque sua senha sob supervisão do responsável.
Remover o seed do repositório não modifica contas existentes.

Depois do bootstrap, uma conexão administrativa pode reduzir ainda mais o runtime:

```sql
REVOKE INSERT ON public.admin_users FROM dogmania_api;
```

Assim o servidor poderá consultar hashes para autenticar, mas não criar novas contas.
Provisionamentos posteriores deverão usar um fluxo administrativo controlado.

## Modelo de acesso e auditoria

| Identidade | Produtos | Administradores | Auditoria |
| --- | --- | --- | --- |
| Browser / anon / authenticated / service_role | Sem grants | Sem grants | Sem grants |
| dogmania_api | CRUD sujeito a políticas específicas | SELECT + INSERT para bootstrap | Sem acesso direto |
| Dono de migração / operador privilegiado | Administração | Administração | Administração |

A autorização de cliente versus administrador é aplicada pelo Spring Security.
RLS limita o acesso à role do servidor; não distingue pessoas logadas usando uma
conexão JDBC compartilhada. O runtime tem acesso a hashes por necessidade do login,
portanto a segurança do host e dos segredos da API continua essencial.

Triggers registram inserção, edição e remoção de produtos, sem expor hashes.
O ator gravado é `session_user` (identidade da conexão), não o e-mail do administrador.
Os registros bloqueiam UPDATE, DELETE e TRUNCATE e o runtime não tem grants para
forjar logs. Um dono de tabela ou operador privilegiado ainda pode alterar triggers
e dados: isso não equivale a armazenamento imutável contra o administrador do banco.

## Fotos dos produtos (opcional)

Execute `setup_storage.sql` no projeto Supabase de teste para criar o bucket
público `product-images`, limitado a JPEG, PNG e WebP de até 5 MiB. As fotos são
públicas por serem imagens do catálogo; nunca envie documentos privados a esse bucket.
Configure o upload apenas no backend conforme `backend-api/README.md`.
A chave `service_role` fica exclusivamente no servidor e não é a senha JDBC.
Não há upload direto do navegador ao Supabase: a API valida o administrador e o arquivo.

O script não cria permissões de escrita para `anon` ou `authenticated`. Revise
políticas já existentes em `storage.objects`: uma política antiga e permissiva
pode conceder escrita a clientes mesmo sem novas policies neste script. Teste
essa configuração no projeto de homologação antes de publicá-la.

## Validação antes da publicação

Execute `tests/access_contract.sql` como dono de migração em banco de teste após
aplicar as migrations. O script usa uma transação revertida e verifica privilégios,
RLS, CRUD, constraints e auditoria. Não é um teste contra o projeto Supabase remoto.

Verifique também TLS, firewall/restrição de rede quando disponível, backups,
restauração, rotação de segredos, autorização da API e monitoramento. Não existe
garantia de sistema 100% seguro. Nesta alteração nenhum recurso remoto foi criado
ou modificado e nenhuma credencial real foi usada.

Também há uma verificação local reproduzível sem instalar PostgreSQL:

```powershell
cd supabase/tests
bun install
bun run test
```

O runner usa [PGlite](https://pglite.dev/docs/about), uma execução PostgreSQL em
WebAssembly, inteiramente em memória. Foram executadas as duas migrations, o seed
e o contrato de acesso com sucesso. Somente as extensões opcionais antigas
`uuid-ossp`/`pgcrypto` são omitidas nesse runner, pois `gen_random_uuid` já existe
no núcleo; funções de Supabase Auth são simuladas apenas para carregar a migration
histórica. As novas policies removem o uso dessas funções. Os testes verificam
grants, RLS, CRUD, preços inválidos, auditoria e bloqueio de leitura de credenciais.
Isso não valida o serviço Supabase hospedado, autenticação de conexões JDBC,
certificados TLS, políticas de Storage ou configuração de rede.

Referências: [proteção de dados no Supabase](https://supabase.com/docs/guides/database/secure-data),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[roles e herança](https://supabase.com/docs/guides/troubleshooting/custom-role-inherits-privileges-that-were-not-explicitly-granted-ddaa1c).
