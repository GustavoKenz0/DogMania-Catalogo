# Verificação local de funcionamento e segurança

Data: 19/10/2026. Escopo: repositório local Dogmania, sem ataques ou alterações em serviços remotos.

## Método

Os testes web usam MockMvc com a **SecurityFilterChain, filtro JWT e parser JWT de produção ativos**. Autenticação usa BCrypt e AuthenticationManager reais; repositórios de usuários são simulados em memória. Nos testes dos endpoints de produtos, apenas serviços de negócio e acesso a usuários são mocks. Isso verifica autorização e validação HTTP, mas não representa uma conexão JDBC com Supabase.

Foram corrigidos testes anteriores que desligavam todos os filtros (`addFilters=false`), usavam `Product.title` quando a entidade possui `name`, e esperavam exclusão lógica apesar da separação atual entre disponibilidade e exclusão definitiva.

## Cobertura executada

| Área | Cenários |
| --- | --- |
| Catálogo público | Listagem sem autenticação; sem sessão/cookie de servidor |
| Autorização | POST, PUT, PATCH disponibilidade e DELETE sem token recusados; catálogo administrativo protegido; usuário sem papel administrativo recebe 403 |
| JWT | Token malformado, assinatura de outra chave, token expirado, emissor incorreto e ausência de claims obrigatórias rejeitados |
| Contas | Administrador desativado não reutiliza JWT existente; login desativado e senha errada recusados |
| Login | BCrypt real, emissão Bearer, `/auth/me` com token emitido; resposta não expõe senha/hash; dados inválidos retornam 400; 11ª tentativa do mesmo endereço retorna 429 |
| Produtos | CRUD e disponibilidade autorizados; campos inválidos e URI `javascript:` não chegam ao serviço; item inativo não aparece no detalhe público |
| Consultas | Limite de página 100 e lista de campos permitidos para ordenação; termo parecido com SQL repassado como parâmetro, sem execução de SQL no teste unitário |
| HTTP | CORS aceita origem configurada e rejeita origem externa; endpoints desconhecidos negados; cabeçalhos nosniff e DENY |
| Upload | Autorização administrativa; vazio, excesso de tamanho e HTML disfarçado rejeitados; destino Storage restrito; nome aleatório gerado ignorando nome original; envio simulado sem rede |

Resultado final Maven: **31 testes aprovados, 0 falhas, 0 erros, 0 ignorados**, exit code 0, usando Java 21.0.12.1 e Maven 3.9.16, repetidos com sucesso após atualização para Spring Boot 3.5.16, Springdoc 2.8.17 e JJWT 0.12.7. Evidências geradas em `backend-api/target/surefire-reports/` (artefatos locais, não versionados). Reprodução: `mvn test` na pasta `backend-api`, com JDK 21 instalado. Neste ambiente o launcher Maven foi chamado diretamente por `org.codehaus.plexus.classworlds.launcher.Launcher` porque `mvn.cmd` retornava acesso negado; heaps Maven e fork limitados a 192 MB.

## Banco de dados

Executadas localmente as duas migrations, seed e `supabase/tests/access_contract.sql` usando PostgreSQL WASM PGlite 0.5.10. O contrato validou privilégios, RLS habilitado, CRUD pelo papel restrito `dogmania_api`, rejeição de preço negativo/NaN, auditoria automática e bloqueio de leitura de credenciais por papéis da API Supabase. O seed não cria administrador com senha compartilhada.

Reprodução na pasta `supabase/tests`: `bun install --frozen-lockfile` e `bun run test`. O runner cria banco descartável, omite somente as extensões legadas uuid-ossp/pgcrypto e simula funções Auth para interpretar a migration histórica; a migration seguinte remove as políticas históricas. Isso não valida Supabase hospedado, conexão JDBC/TLS, Storage remoto nem configurações da organização.

## Script HTTP seguro

`tests/security_attack_simulation.ps1` agora executa somente consultas e preflight locais, sem payload de DROP TABLE, sem escrita de produtos e sem redirecionamentos/proxy. URLs remotas são rejeitadas antes de fazer requisições. Falha de conexão conta como falha de teste e termina com exit code 1.

Executado contra `http://127.0.0.1:1/api/v1` sem servidor: 0/5 testes, exit 1, comportamento esperado para verificar falha de conexão. Executado com URL externa: recusado, exit 1, sem acesso remoto. O smoke HTTP contra uma API completa com banco real não foi executado nesta etapa.

Para usar em desenvolvimento: `powershell -NoProfile -File tests/security_attack_simulation.ps1 -BaseUrl http://127.0.0.1:8080/api/v1`.

## Limites e próximos controles

Não existe certificação de “100% seguro”. Esses testes não equivalem a pentest completo ou cobertura integral OWASP Top 10. Um 401 em uma requisição com script não comprova prevenção de XSS; por isso o script não faz mais essa alegação. A segurança da renderização no navegador requer validação própria, assim como consultas reais PostgreSQL, fluxos concorrentes e implantação.

- Nenhuma credencial remota foi utilizada; migrations, configuração de papéis e Storage ainda precisam ser aplicadas ao ambiente correto e verificadas lá.
- O frontend teve dependências atualizadas e `bun audit --json` retornou `{}` com exit code 0 em 19/10/2026 (execução pelo orquestrador). O backend foi atualizado para Spring Boot 3.5.16, Springdoc 2.8.17 e JJWT 0.12.7. Não foi executado scanner completo de CVEs Maven; versões e avisos de segurança exigem acompanhamento contínuo.
- O limitador de login é por instância e endereço remoto; produção exige limite no gateway e revisão de proxies confiáveis.
- Upload valida assinatura/tamanho/formato; não é antivírus nem reprocessamento integral da imagem. O sucesso de envio foi simulado com HttpClient mockado.
- Backup/restauração, rotação de segredos, TLS, políticas de hospedagem e monitoramento precisam de verificação operacional.
