# Dogmania — catálogo e administração

Contexto para continuidade e relatório único de alterações:
[CONTEXTO_DO_PROJETO.md](CONTEXTO_DO_PROJETO.md). Leia esse arquivo antes de modificar
o projeto e atualize-o a cada entrega, conforme `AGENTS.md`.

Repositório de destino: [GustavoKenz0/DogMania-Catalogo](https://github.com/GustavoKenz0/DogMania-Catalogo).
Commits e pushes exigem aprovação explícita do usuário para cada entrega. Exemplos
de configuração sem credenciais são versionados; arquivos locais com segredos,
dependências instaladas e saídas de build são excluídos pelo `.gitignore`.

O projeto possui três partes: vitrine e painel React, API Java e banco PostgreSQL no Supabase. O navegador chama somente a API Java; credenciais do banco e a chave de serviço Supabase pertencem exclusivamente ao backend.

```text
Dogmania-Catalogo/  frontend React + TanStack Start + TypeScript
backend-api/       API Spring Boot + JPA + Spring Security
supabase/          migrações, storage e testes SQL
tests/             simulações de segurança HTTP locais
```

## Iniciar com dois cliques no Windows

Com as dependências e o banco já configurados, dê dois cliques em
**`Iniciar Dogmania.cmd`**, na raiz do projeto. O iniciador abre as janelas
**Dogmania - Backend** e **Dogmania - Site**, aguarda os dois serviços responderem
e abre `http://127.0.0.1:8081/` no navegador padrão.

Mantenha as duas janelas abertas enquanto usar o sistema. Para encerrar, pressione
**Ctrl+C** em cada janela ou feche ambas. Serviços já disponíveis são reaproveitados;
portas ocupadas por serviços sem a resposta esperada são informadas, sem encerrar
processos. O iniciador não instala dependências nem executa o provisionamento.
O auxiliar `iniciar-local.ps1` deve permanecer junto ao arquivo `.cmd`.

## Preparar banco e API

1. Instale JDK 21, Maven 3.9 e Bun. Tenha uma instância Supabase PostgreSQL de desenvolvimento.
2. Faça backup de bancos existentes e siga [supabase/README.md](supabase/README.md) para aplicar as migrações em ordem e configurar a role de runtime `dogmania_api`. O Hibernate apenas valida o esquema.
3. Configure no ambiente/IDE as variáveis de [backend-api/.env.example](backend-api/.env.example) ou execute `backend-api/configure-local.ps1` no Windows. O configurador cria um `.env.local` protegido e ignorado pelo Git; Spring lê esse arquivo ao iniciar na pasta `backend-api/`. Use credenciais próprias e TLS com certificado validado.
4. Crie o primeiro administrador com o bootstrap temporário conforme [backend-api/README.md](backend-api/README.md), depois desative-o. Não há conta ou senha de demonstração.
5. Em um terminal na pasta `backend-api`, execute:

```sh
mvn spring-boot:run
```

A API usa `http://localhost:8080/api/v1`. Configure `CORS_ORIGINS` com a origem do frontend. Uploads Supabase são opcionais e exigem a configuração adicional descrita na documentação da API e do banco.

No Windows, `.\start-local.ps1`, na pasta `backend-api/`, também inicia a API e
encontra o Maven no cache Wrapper quando ele não está no PATH. Para conferir a
configuração sem conectar, use `.\start-local.ps1 -Check`.

No Windows, `backend-api/complete-local.ps1` oferece um fluxo para projeto novo
já migrado, com geração de senhas e documento privado de acessos, mediante pedido
do responsável. Veja [as instruções da API](backend-api/README.md).
`.private/` contém dados locais sensíveis e não deve ser publicado nem incluído
em relatórios, backups compartilhados ou mensagens.

## Executar frontend

Em outro terminal, na pasta `Dogmania-Catalogo`, copie `.env.example` para `.env.local` e ajuste `VITE_API_URL`. Variáveis `VITE_*` são públicas: nunca coloque senhas ou chaves de serviço nelas.

```sh
bun install
bun run dev
```

Abra `http://127.0.0.1:8081`. A vitrine é pública; `/admin` pede credenciais de administrador. `/dogmania-painel` é um atalho para o painel. Produtos são persistidos pela API no banco; não existe catálogo local de demonstração como fallback.

## Projeto no VS Code

Abra esta raiz como pasta do projeto. O código em uso está em `backend-api/`
e `Dogmania-Catalogo/`. A pasta `.tools/` contém utilitários, logs e
cópias antigas de revisão; ela não é outra instalação do sistema.

`.vscode/settings.json` exclui as cópias temporárias da importação Java/Maven,
da atualização de recursos, busca e observação de arquivos. Elas também ficam
ocultas no explorador para evitar editar uma cópia em vez do código atual.
Os diagnósticos do backend e do frontend reais continuam ativos.

Se ainda houver avisos de uma importação antiga, use **Ctrl+Shift+P** →
**Java: Clean Java Language Server Workspace** e confirme a reinicialização.
Abra os arquivos Java da pasta `backend-api/src/`, não da cópia de revisão.
Apenas este arquivo de configuração do editor, sem segredos ou caminhos pessoais,
é versionado; os demais arquivos de `.vscode/` permanecem ignorados.

### Erro de construtores Lombok no editor

A extensão Java Red Hat 1.57.0 tem uma regressão com construtores gerados pelo
Lombok em projetos Java 21 ([issue oficial #4521](https://github.com/redhat-developer/vscode-java/issues/4521)).
A mensagem menciona Flexible Constructor Bodies/Java 25 mesmo sem esse recurso no código.
A solução provisória aplicada neste computador foi instalar e fixar a extensão 1.56.0:

```sh
code --install-extension redhat.java@1.56.0 --force
```

Depois use **Ctrl+Shift+P** → **Developer: Reload Window**. Se restarem diagnósticos
anteriores, execute **Java: Clean Java Language Server Workspace** e reinicie quando
solicitado. A versão da extensão é uma configuração local, não é instalada pelo Git.
Reavalie a atualização quando a correção oficial estiver disponível.

O projeto continua em Java 21, com análise de nulidade habilitada. O arquivo
`backend-api/lombok.config` faz o Lombok gerar contratos de nulidade Spring nos
métodos auxiliares suportados, usando anotações já presentes nas dependências.

## Produtos de exemplo e conferência de persistência

No ambiente de desenvolvimento configurado, a ferramenta abaixo mantém seis produtos
identificados por **[EXEMPLO]**, cinco ativos e um sem estoque. Os preços são fictícios
e as fotografias ilustrativas. Ela testa a API e confere os registros por uma conexão
JDBC independente ao banco configurado em `backend-api/.env.local`.

```powershell
.\tests\catalog\criar-e-validar-exemplos.ps1
```

Informe e-mail/senha do administrador nos prompts locais; a senha é oculta. Neste
computador, a opção `-UseLocalCredentials` permite usar explicitamente o documento
privado já existente, sem imprimir acessos. A ferramenta exige API iniciada, Java 21+
e o driver PostgreSQL previamente resolvido pelas dependências Maven.

**O comando grava dados no banco configurado.** Use em desenvolvimento. A repetição
reaproveita exemplos idênticos; se um exemplo já tiver sido editado, interrompe para
preservá-lo. O CRUD usa apenas um registro temporário próprio, removido ao concluir;
as provas SQL de constraints são revertidas. Os seis exemplos ficam disponíveis no
painel para uso manual. Nenhum administrador, migration ou senha é criado/alterado.

## Validação e publicação

- Frontend: `bun run build` e `bun x tsc --noEmit`, dentro de `Dogmania-Catalogo`.
- Backend: `mvn test`, dentro de `backend-api`; testes isolados não substituem homologação PostgreSQL.
- Banco: consulte `supabase/README.md` e o executor em `supabase/tests`.
- Segurança HTTP: consulte `tests/security_attack_simulation.ps1` e execute somente contra ambiente local/de homologação autorizado.

Migrações e deployment de produção precisam de credenciais e revisão operacional próprias. Configure HTTPS, segredos, backups com restauração validada, monitoramento e atualização de dependências. Não há garantia de segurança absoluta.

Em 19/10/2026, a atualização das dependências do frontend foi seguida por `bun audit --json`: sem alertas conhecidos reportados naquele momento. Esse resultado depende da base de advisories consultada e não comprova ausência de vulnerabilidades.
