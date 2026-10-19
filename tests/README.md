# Verificações de segurança locais

`security_attack_simulation.ps1` executa verificações HTTP não destrutivas em uma instância de desenvolvimento já iniciada. Ele aceita somente HTTP em loopback, não segue redirecionamentos e retorna falha se o servidor estiver indisponível.

```powershell
./tests/security_attack_simulation.ps1 -BaseUrl http://127.0.0.1:8080/api/v1
```

O script verifica leitura pública, bloqueio anônimo das rotas administrativas, rejeição de token malformado e rejeição de preflight CORS de origem externa. Não realiza exploração nem alterações no banco.

Os cenários de autorização das mutações, validação de dados e autenticação estão em `backend-api/src/test/java`; execute `mvn test` dentro de `backend-api`. Os testes de SQL e roles ficam em `supabase/tests`, conforme `supabase/README.md`.

Esses checks não certificam cobertura OWASP, ausência de SQL injection/XSS ou segurança de produção. Integração real com PostgreSQL, storage, TLS, gateway e configuração de produção exige homologação específica.
