import java.io.Console;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Base64;
import java.util.Properties;
import org.postgresql.PGConnection;

/**
 * Local, interactive provisioning after the two SQL migrations.
 * Source-file launcher tool, deliberately outside the Spring application.
 */
public final class ProvisionDatabase {
    public static void main(String[] args) {
        boolean localRequest = args.length == 3;
        Console console = localRequest ? null : System.console();
        if (!localRequest && console == null) {
            System.err.println("Abra o terminal PowerShell do VS Code ou Windows Terminal para digitar senhas ocultas.");
            System.exit(1);
        }
        if ((args.length != 2 && args.length != 3)
                || !args[0].matches("aws-[0-9]+-[a-z0-9-]+\\.pooler\\.supabase\\.com")
                || !args[1].matches("[a-z0-9]{20}")) {
            System.err.println("Informe o host do session pooler e o identificador do projeto.");
            System.exit(1);
        }
        String certificateFile = System.getProperty("dogmania.setup.caCertificate", "");
        String tlsOptions = certificateFile.isBlank()
                ? "&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory"
                : "&sslrootcert=" + URLEncoder.encode(Path.of(certificateFile).toAbsolutePath().toString(), StandardCharsets.UTF_8);
        String url = "jdbc:postgresql://" + args[0] + ":5432/postgres"
                + "?sslmode=verify-full" + tlsOptions
                + "&connectTimeout=10&socketTimeout=30";
        char[] ownerPassword = null;
        char[] runtimePassword = null;
        char[] confirmation = null;
        Properties credentials = new Properties();
        int result = 1;
        boolean committed = false;
        try {
            if (localRequest) {
                Properties request = new Properties();
                try (var input = Files.newInputStream(Path.of(args[2]))) {
                    request.load(input);
                }
                try {
                    ownerPassword = new String(Base64.getDecoder().decode(
                            request.getProperty("ownerPasswordB64", "")), StandardCharsets.UTF_8).toCharArray();
                    runtimePassword = new String(Base64.getDecoder().decode(
                            request.getProperty("runtimePasswordB64", "")), StandardCharsets.UTF_8).toCharArray();
                } finally {
                    request.clear();
                }
                confirmation = runtimePassword.clone();
            } else {
                ownerPassword = console.readPassword("Senha do banco postgres do projeto Supabase: ");
            }
            if (ownerPassword == null || ownerPassword.length == 0) {
                throw new IllegalArgumentException("Senha do banco obrigatoria.");
            }
            credentials.setProperty("user", "postgres." + args[1]);
            credentials.setProperty("password", new String(ownerPassword));
            try (Connection connection = DriverManager.getConnection(url, credentials)) {
                credentials.clear();
                checkSchemaAndRole(connection);
                if (!localRequest) {
                    runtimePassword = console.readPassword("Crie uma senha exclusiva para dogmania_api (minimo 16 caracteres): ");
                    confirmation = console.readPassword("Repita a senha de dogmania_api: ");
                }
                if (runtimePassword == null || runtimePassword.length < 16
                        || new String(runtimePassword).isBlank()
                        || !Arrays.equals(runtimePassword, confirmation)
                        || Arrays.equals(ownerPassword, runtimePassword)) {
                    throw new IllegalArgumentException("Use uma senha exclusiva com 16 ou mais caracteres e confirmacao igual.");
                }
                connection.setAutoCommit(false);
                try {
                    // Driver generates a salted SCRAM verifier locally; plaintext is not put into SQL.
                    char[] driverPassword = runtimePassword.clone();
                    try {
                        connection.unwrap(PGConnection.class).alterUserPassword(
                                "dogmania_api", driverPassword, "scram-sha-256");
                    } finally {
                        Arrays.fill(driverPassword, '\0');
                    }
                    try (Statement statement = connection.createStatement()) {
                        statement.execute("ALTER ROLE dogmania_api LOGIN");
                    }
                    connection.commit();
                    committed = true;
                } catch (SQLException error) {
                    connection.rollback();
                    throw error;
                }
            }
            credentials.setProperty("user", "dogmania_api." + args[1]);
            credentials.setProperty("password", new String(runtimePassword));
            try (Connection runtime = DriverManager.getConnection(url, credentials);
                    Statement statement = runtime.createStatement();
                    ResultSet rows = statement.executeQuery(
                            "SELECT current_user")) {
                // verify-full in the JDBC URL enforces TLS on the client-to-pooler connection.
                // pg_stat_ssl would describe the pooler's separate connection to PostgreSQL.
                if (!rows.next() || !"dogmania_api".equals(rows.getString(1))) {
                    throw new IllegalArgumentException("Identidade inesperada na conexao runtime.");
                }
                statement.execute("SELECT name, sort_order FROM public.products LIMIT 0");
            }
            System.out.println("Role dogmania_api habilitada; conexao JDBC da role confirmada com TLS.");
            result = 0;
        } catch (IllegalArgumentException error) {
            System.err.println(error.getMessage());
        } catch (SQLException error) {
            // Do not dump driver/server messages: they may contain SQL or credential details.
            String state = error.getSQLState();
            System.err.println("Falha JDBC (SQLSTATE " + (state == null ? "indisponivel" : state) + ").");
            Throwable cause = error.getCause();
            for (int depth = 0; cause != null && depth < 5; depth++, cause = cause.getCause()) {
                System.err.println("Tipo da causa: " + cause.getClass().getSimpleName());
            }
            if ("28P01".equals(state)) {
                System.err.println("Confira a senha, o projeto e o host de conexao no painel Supabase.");
            } else if ("42501".equals(state)) {
                System.err.println("A conexao de provisionamento precisa usar o postgres do projeto.");
            } else {
                System.err.println("Confira rede, certificado TLS e aplicacao das duas migrations. Nao desative verify-full.");
            }
        } catch (Exception error) {
            System.err.println("Provisionamento interrompido (" + error.getClass().getSimpleName() + ").");
        } finally {
            credentials.clear();
            if (ownerPassword != null) Arrays.fill(ownerPassword, '\0');
            if (runtimePassword != null) Arrays.fill(runtimePassword, '\0');
            if (confirmation != null) Arrays.fill(confirmation, '\0');
        }
        if (committed && result != 0) {
            System.err.println("A role foi habilitada, mas a verificacao posterior falhou. A senha escolhida continua vigente.");
            System.err.println("Nao repita o provisionamento; corrija a conexao e use configure-local.ps1.");
        }
        System.exit(result);
    }

    private static void checkSchemaAndRole(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement();
                ResultSet role = statement.executeQuery("""
                    SELECT rolcanlogin, rolsuper OR rolcreatedb OR rolcreaterole OR
                           rolreplication OR rolbypassrls OR rolinherit OR
                           EXISTS(SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid) OR
                           EXISTS(SELECT 1 FROM pg_class c WHERE c.relowner=r.oid)
                    FROM pg_roles r WHERE rolname='dogmania_api'
                    """)) {
            if (!role.next()) {
                throw new IllegalArgumentException("Role ausente. Aplique as duas migrations antes de continuar.");
            }
            if (role.getBoolean(1)) {
                throw new IllegalArgumentException("Role ja habilitada. Use configure-local.ps1; a senha nao sera alterada.");
            }
            if (role.getBoolean(2)) {
                throw new IllegalArgumentException("Role com privilegios inesperados. Revise a migration de acesso.");
            }
        }
        try (Statement statement = connection.createStatement();
                ResultSet schema = statement.executeQuery("""
                    SELECT count(*)=3 AND bool_and(c.relrowsecurity)
                    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                    WHERE n.nspname='public' AND c.relname IN ('products','admin_users','audit_logs')
                    """)) {
            if (!schema.next() || !schema.getBoolean(1)) {
                throw new IllegalArgumentException("Schema ou RLS incompleto. Confira as duas migrations.");
            }
            statement.execute("SELECT name, sort_order FROM public.products LIMIT 0");
        }
    }
}
