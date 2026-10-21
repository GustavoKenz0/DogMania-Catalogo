import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.Objects;
import java.util.Properties;
import java.util.UUID;

/** Confirma produtos criados pela API; provas SQL sempre revertidas. Não provisiona o banco. */
public final class VerifyExampleProducts {
    private static int checks;
    private static void check(boolean passed, String label) {
        if (!passed) throw new IllegalStateException(label);
        checks++;
        System.out.println("PASS PostgreSQL: " + label);
    }
    private static Properties read(Path file) throws Exception {
        Properties values = new Properties();
        try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) { values.load(reader); }
        return values;
    }
    public static void main(String[] args) {
        Properties environment = new Properties();
        Properties credentials = new Properties();
        try {
            if (args.length != 2) throw new IllegalArgumentException("Informe raiz do projeto e manifesto temporário.");
            Path root = Path.of(args[0]).toAbsolutePath().normalize();
            Path manifest = Path.of(args[1]).toAbsolutePath().normalize();
            if (!manifest.startsWith(root.resolve(".tools"))) throw new IllegalArgumentException("Manifesto fora de .tools.");
            environment = read(root.resolve("backend-api/.env.local"));
            String url = environment.getProperty("SUPABASE_DB_URL", "");
            if (!url.startsWith("jdbc:postgresql://") || !url.matches(".*[?&]sslmode=verify-full(?:&.*)?")) {
                throw new IllegalArgumentException("A conexão deve preservar TLS verify-full.");
            }
            credentials.setProperty("user", environment.getProperty("SUPABASE_DB_USER", ""));
            credentials.setProperty("password", environment.getProperty("SUPABASE_DB_PASSWORD", ""));
            Properties expected = read(manifest);
            try (Connection connection = DriverManager.getConnection(url, credentials)) {
                environment.clear(); credentials.clear();
                try (Statement statement = connection.createStatement(); ResultSet row = statement.executeQuery("SELECT current_user")) {
                    check(row.next() && "dogmania_api".equals(row.getString(1)), "conexão independente com role restrita");
                }
                int count = Integer.parseInt(expected.getProperty("count"));
                if (count != 6) throw new IllegalArgumentException("São esperados seis exemplos.");
                for (int i = 0; i < count; i++) {
                    String prefix = i + ".";
                    try (PreparedStatement statement = connection.prepareStatement("SELECT name,description,price,category,image,badge,active,created_at,updated_at FROM public.products WHERE id=?")) {
                        statement.setObject(1, UUID.fromString(expected.getProperty(prefix + "id")));
                        try (ResultSet row = statement.executeQuery()) {
                            boolean matches = row.next()
                                && Objects.equals(row.getString("name"), expected.getProperty(prefix + "title"))
                                && Objects.equals(row.getString("description"), expected.getProperty(prefix + "description"))
                                && row.getBigDecimal("price").compareTo(new BigDecimal(expected.getProperty(prefix + "price"))) == 0
                                && Objects.equals(row.getString("category"), expected.getProperty(prefix + "category"))
                                && Objects.equals(row.getString("image"), expected.getProperty(prefix + "image"))
                                && Objects.equals(row.getString("badge"), expected.getProperty(prefix + "badge"))
                                && row.getBoolean("active") == Boolean.parseBoolean(expected.getProperty(prefix + "active"))
                                && row.getTimestamp("created_at") != null && row.getTimestamp("updated_at") != null;
                            check(matches, "campos e timestamps persistidos: " + expected.getProperty(prefix + "title"));
                        }
                    }
                }
                connection.setAutoCommit(false);
                try {
                    long before = countProducts(connection);
                    Object[][] cases = {
                        {"preço negativo", "Produto temporário", "-1.00", "Cães", 0, "23514"},
                        {"preço zero", "Produto temporário", "0.00", "Cães", 0, "23514"},
                        {"preço NaN", "Produto temporário", "NaN", "Cães", 0, "23514"},
                        {"nome ausente", null, "10.00", "Cães", 0, "23502"},
                        {"nome com um caractere", "A", "10.00", "Cães", 0, "23514"},
                        {"nome com 151 caracteres", "A".repeat(151), "10.00", "Cães", 0, "22001"},
                        {"categoria ausente", "Produto temporário", "10.00", null, 0, "23502"},
                        {"categoria com um caractere", "Produto temporário", "10.00", "A", 0, "23514"},
                        {"ordem negativa", "Produto temporário", "10.00", "Cães", -1, "23514"},
                        {"preço acima de numeric(10,2)", "Produto temporário", "100000000.00", "Cães", 0, "22003"}
                    };
                    for (Object[] scenario : cases) {
                        Savepoint savepoint = connection.setSavepoint();
                        boolean rejected = false;
                        try (PreparedStatement statement = connection.prepareStatement("INSERT INTO public.products(name,description,price,category,image,active,sort_order) VALUES(?,?,CAST(? AS numeric),?,?,?,?)")) {
                            statement.setString(1, (String) scenario[1]);
                            statement.setString(2, "Prova SQL temporária: transação revertida.");
                            statement.setString(3, (String) scenario[2]);
                            statement.setString(4, (String) scenario[3]);
                            statement.setString(5, "https://example.com/teste.jpg");
                            statement.setBoolean(6, false);
                            statement.setInt(7, (Integer) scenario[4]);
                            statement.executeUpdate();
                        } catch (SQLException error) {
                            rejected = scenario[5].equals(error.getSQLState());
                        } finally {
                            connection.rollback(savepoint);
                            connection.releaseSavepoint(savepoint);
                        }
                        check(rejected, "constraint recusa " + scenario[0] + " (SQLSTATE " + scenario[5] + ")");
                    }
                    check(before == countProducts(connection), "provas SQL não acrescentaram produtos");
                } finally { connection.rollback(); }
            }
            System.out.println("PostgreSQL: " + checks + " verificações aprovadas; exemplos mantidos, provas inválidas revertidas.");
        } catch (Exception error) {
            // Não imprimir mensagens do driver, credenciais, URL de conexão ou stack trace.
            System.err.println("FAIL verificação PostgreSQL: " + error.getClass().getSimpleName());
            System.exit(1);
        } finally { environment.clear(); credentials.clear(); }
    }
    private static long countProducts(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement(); ResultSet row = statement.executeQuery("SELECT count(*) FROM public.products")) {
            row.next(); return row.getLong(1);
        }
    }
}
