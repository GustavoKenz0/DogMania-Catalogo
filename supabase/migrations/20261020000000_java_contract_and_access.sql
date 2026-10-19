-- Follow-up to 20261019_initial_schema.sql. Run as migration owner, never as API user.
-- Java authenticates administrators. Supabase Auth JWT claims are not used by this app.
BEGIN;

ALTER TABLE public.products RENAME COLUMN title TO name;
ALTER TABLE public.products ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN image TYPE varchar(2048);
ALTER TABLE public.admin_users ALTER COLUMN email TYPE varchar(255);
ALTER TABLE public.admin_users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.admin_users ALTER COLUMN role TYPE varchar(20) USING role::text;
UPDATE public.admin_users SET role = 'SUPER_ADMIN' WHERE role = 'SUPERADMIN';
ALTER TABLE public.admin_users ALTER COLUMN role SET DEFAULT 'ADMIN';
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_allowed
    CHECK (role IN ('ADMIN', 'SUPER_ADMIN'));
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_bcrypt_hash
    CHECK (password_hash ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$');
ALTER TABLE public.products ADD CONSTRAINT products_sort_order_nonnegative CHECK (sort_order >= 0);
-- Explicitly reject NaN: PostgreSQL numeric considers NaN greater than ordinary numbers.
ALTER TABLE public.products ADD CONSTRAINT products_price_finite CHECK (price <> 'NaN'::numeric);

-- Fails on case-insensitive duplicate emails instead of silently merging accounts.
CREATE UNIQUE INDEX idx_admin_users_email_lower ON public.admin_users (lower(email));
CREATE INDEX idx_products_active_order ON public.products (sort_order, created_at DESC) WHERE active;
CREATE INDEX idx_products_active_category_order ON public.products (category, sort_order) WHERE active;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- A connection role exclusively for this Java API; password provisioned outside migrations.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dogmania_api') THEN
        CREATE ROLE dogmania_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS;
    END IF;
END $$;

-- Refuse to silently reuse a privileged role or the table owner as runtime identity.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dogmania_api'
        AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls))
        OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_roles r ON r.oid = c.relowner
            WHERE r.rolname = 'dogmania_api' AND c.oid IN
                ('public.products'::regclass, 'public.admin_users'::regclass, 'public.audit_logs'::regclass))
        OR EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.member
            WHERE r.rolname = 'dogmania_api') THEN
        RAISE EXCEPTION 'dogmania_api must be a non-owner role without privileged attributes or memberships';
    END IF;
END $$;

-- Remove the former policies based on unrelated Supabase Auth metadata.
DROP POLICY IF EXISTS "Public Read Active Products" ON public.products;
DROP POLICY IF EXISTS "Admins Read All Products" ON public.products;
DROP POLICY IF EXISTS "Admins Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admins Update Products" ON public.products;
DROP POLICY IF EXISTS "Admins Delete Products" ON public.products;
DROP POLICY IF EXISTS "Admins View Own Profile" ON public.admin_users;
DROP POLICY IF EXISTS "Append Only Audit Logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins Read Audit Logs" ON public.audit_logs;

REVOKE ALL ON TABLE public.products, public.admin_users, public.audit_logs
    FROM PUBLIC, anon, authenticated, service_role, dogmania_api;
GRANT USAGE ON SCHEMA public TO dogmania_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO dogmania_api;
-- INSERT supports the explicitly enabled first-administrator bootstrap in Java.
GRANT SELECT, INSERT ON public.admin_users TO dogmania_api;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY java_products_select ON public.products FOR SELECT TO dogmania_api USING (true);
CREATE POLICY java_products_insert ON public.products FOR INSERT TO dogmania_api WITH CHECK (true);
CREATE POLICY java_products_update ON public.products FOR UPDATE TO dogmania_api USING (true) WITH CHECK (true);
CREATE POLICY java_products_delete ON public.products FOR DELETE TO dogmania_api USING (true);
CREATE POLICY java_admin_lookup ON public.admin_users FOR SELECT TO dogmania_api USING (true);
CREATE POLICY java_admin_bootstrap ON public.admin_users FOR INSERT TO dogmania_api WITH CHECK (true);

-- Product changes always produce an audit record; the API cannot insert forged logs.
-- This identity is the database login, not the person authenticated by Java.
CREATE OR REPLACE FUNCTION public.audit_product_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, performed_by, details)
    VALUES (TG_OP, 'product', COALESCE(NEW.id, OLD.id), session_user,
        jsonb_build_object('old_active', CASE WHEN TG_OP <> 'INSERT' THEN OLD.active END,
                           'new_active', CASE WHEN TG_OP <> 'DELETE' THEN NEW.active END)::text);
    RETURN NULL;
END;
$$;
CREATE TRIGGER trg_product_audit AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.audit_product_change();

CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
    RAISE EXCEPTION 'Audit records cannot be updated, deleted or truncated';
END;
$$;
CREATE TRIGGER trg_prevent_audit_truncate BEFORE TRUNCATE ON public.audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_audit_tampering();

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated, service_role, dogmania_api;
REVOKE ALL ON FUNCTION public.prevent_audit_tampering() FROM PUBLIC, anon, authenticated, service_role, dogmania_api;
REVOKE ALL ON FUNCTION public.audit_product_change() FROM PUBLIC, anon, authenticated, service_role, dogmania_api;

-- Defaults apply to tables subsequently created by the migration role, not Supabase internals.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMIT;
