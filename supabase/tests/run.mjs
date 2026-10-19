import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Disposable PostgreSQL in WASM. Supabase Auth is stubbed solely to parse the
// historical migration; the following migration removes all of its policies.
// gen_random_uuid is built in. Optional legacy extensions are not installed here.
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
  `);
  const directory = new URL("../migrations/", import.meta.url);
  for (const filename of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = (await readFile(new URL(filename, directory), "utf8"))
      .replace(/^CREATE EXTENSION IF NOT EXISTS "(?:uuid-ossp|pgcrypto)";\s*$/gm, "");
    await db.exec(sql);
    console.log(`PASS migration ${filename}`);
  }
  await db.exec(await readFile(new URL("../seed.sql", import.meta.url), "utf8"));
  console.log("PASS development seed (no shared administrator)");
  const contract = (await readFile(new URL("access_contract.sql", import.meta.url), "utf8"))
    .split("\n").filter((line) => !line.startsWith("\\")).join("\n");
  await db.exec(contract);
  console.log("PASS access contract: privileges, RLS, CRUD, price constraints, audit and credential denial");
  const admins = await db.query("SELECT count(*)::int AS count FROM public.admin_users");
  if (admins.rows[0].count !== 0) throw new Error("Seed must not create a shared administrator");
  console.log("PASS no default administrator");
  console.log("Local checks complete. Hosted Supabase, Storage policies, JDBC/TLS and network were not tested.");
} catch (error) {
  console.error(`FAIL database checks: ${error.message}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
