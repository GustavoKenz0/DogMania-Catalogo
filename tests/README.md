# Verificações de segurança locais

`security_attack_simulation.ps1` executa verificações HTTP não destrutivas em uma instância de desenvolvimento já iniciada. Ele aceita somente HTTP em loopback, não segue redirecionamentos e retorna falha se o servidor estiver indisponível.

```powershell
./tests/security_attack_simulation.ps1 -BaseUrl http://127.0.0.1:8080/api/v1
```

O script verifica leitura pública, bloqueio anônimo das rotas administrativas, rejeição de token malformado e rejeição de preflight CORS de origem externa. Não realiza exploração nem alterações no banco.

Os cenários de autorização das mutações, validação de dados e autenticação estão em `backend-api/src/test/java`; execute `mvn test` dentro de `backend-api`. Os testes de SQL e roles ficam em `supabase/tests`, conforme `supabase/README.md`.

Esses checks não certificam cobertura OWASP, ausência de SQL injection/XSS ou segurança de produção. Integração real com PostgreSQL, storage, TLS, gateway e configuração de produção exige homologação específica.

## Homologação do catálogo e do painel

Use uma prévia HTTPS com banco, armazenamento e conta administrativa exclusivos
da homologação. Registre a data, o SHA do código, o ambiente, a pessoa responsável
e o resultado de cada etapa. Compare com a versão que será disponibilizada à loja.

1. Abra a home e o catálogo em um celular e em um desktop. Faça uma busca pelo
   nome de um produto, alterne categoria e subcategoria, abra um detalhe e volte
   aos resultados. Confirme o estado vazio para busca sem resultados e o aviso
   ao abrir um produto indisponível.
2. Compare a vitrine com a lista aprovada pela loja. Confira nomes, preços,
   descrições, categorias, disponibilidade e imagens carregadas. Produtos
   marcados como `[EXEMPLO]`, `[TESTE TEMPORARIO]` ou com conteúdo fictício devem
   estar fora da vitrine pública. Os dados em `catalog/produtos-exemplo.json`
   e `../supabase/seed.sql` são destinados a ambientes descartáveis.
3. No celular, abra o WhatsApp pelo cartão e pelo detalhe de um produto.
   Confira com a loja o destinatário e o nome do produto na mensagem
   preenchida. Combine com o responsável da loja o envio e o recebimento
   de uma mensagem de teste antes de marcar esse aceite como aprovado.
4. Entre em `/admin` com a conta de homologação. Cadastre um produto de teste
   ativo com título único, preço, categoria e URL HTTPS de imagem. Confirme
   que ele aparece na lista pública e que o detalhe abre sem login.
5. Tente salvar um preço inválido no produto criado. Confira o aviso e
   verifique que o valor anterior permanece. Edite o nome e o preço com
   valores válidos e confira os novos dados no catálogo em outra janela.
   Desative o produto, verifique sua ausência na listagem e a mensagem no
   link direto. Reative, confirme o reaparecimento e exclua o produto de
   teste. Confira sua ausência no painel e no catálogo.
6. Saia do painel e reabra `/admin`. Confira que a tela de login aparece.

Para automatizar o CRUD, execute `catalog/criar-e-validar-exemplos.ps1` em um
checkout de teste separado. Confirme que a API local na porta 8080 e o arquivo
`backend-api/.env.local` desse checkout apontam para o mesmo banco
descartável. Informe a conta de teste na entrada interativa. O script cria
exemplos, executa mutações e consulta o banco pelo driver JDBC.

## Ensaio de restauração e alerta

- Em uma cópia isolada, crie um marcador conhecido e gere o backup. Registre a
  data, a versão, o horário do último dado recuperado e o tempo máximo de
  recuperação combinado com a loja. Restaure em um destino novo e isolado.
  Compare o marcador, os produtos, a auditoria e as permissões. Repita os
  passos 4 a 6 do aceite. Valide também o armazenamento das imagens quando
  usado. Registre o tempo medido, a defasagem e os itens que ficaram pendentes.
- Na homologação, provoque uma falha controlada na checagem de catálogo
  configurada no monitor. Confirme que o responsável recebe um alerta com o
  ambiente afetado e que a recuperação é comunicada após a checagem voltar a
  passar. Registre os horários e o canal utilizado.
- Para o ensaio local em memória, execute `bun run test` em
  `supabase/tests/` com as dependências já instaladas. O runner aplica as
  migrações e o seed de desenvolvimento em PGlite, tira uma cópia da base,
  altera a origem e verifica dados, auditoria e o contrato de acesso em uma
  instância restaurada. Esse resultado cobre o snapshot local de PGlite.
