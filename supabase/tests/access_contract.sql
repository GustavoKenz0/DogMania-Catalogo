-- Run as migration owner in a disposable test database after both migrations.
-- Every successful check is rolled back; ON_ERROR_STOP prevents false success in psql.
\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
    identity_name text;
    table_name text;
    privilege_name text;
BEGIN
    FOREACH identity_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        FOREACH table_name IN ARRAY ARRAY['products', 'admin_users', 'audit_logs'] LOOP
            FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
                IF has_table_privilege(identity_name, 'public.' || table_name, privilege_name) THEN
                    RAISE EXCEPTION 'Unexpected % privilege for % on %', privilege_name, identity_name, table_name;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('public.products'::regclass,
        'public.admin_users'::regclass, 'public.audit_logs'::regclass) AND NOT relrowsecurity) THEN
        RAISE EXCEPTION 'RLS must be enabled on every application table';
    END IF;
    IF has_table_privilege('dogmania_api', 'public.audit_logs', 'INSERT')
        OR has_table_privilege('dogmania_api', 'public.admin_users', 'UPDATE')
        OR has_table_privilege('dogmania_api', 'public.products', 'TRUNCATE') THEN
        RAISE EXCEPTION 'Runtime holds excessive privileges';
    END IF;
END $$;

DO $$
DECLARE product_id uuid := gen_random_uuid();
BEGIN
    EXECUTE 'SET LOCAL ROLE dogmania_api';
    INSERT INTO public.products (id, name, price, category, description, image)
        VALUES (product_id, 'Security test product', 1.00, 'Teste', 'Test only', 'https://example.com/test.png');
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = product_id) THEN
        RAISE EXCEPTION 'Runtime cannot read inserted product';
    END IF;
    UPDATE public.products SET active = false WHERE id = product_id;
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND NOT active) THEN
        RAISE EXCEPTION 'Runtime cannot manage inactive products';
    END IF;
    DELETE FROM public.products WHERE id = product_id;
    BEGIN
        INSERT INTO public.products (name, price, category) VALUES ('Invalid price', -1, 'Teste');
        RAISE EXCEPTION 'Negative price was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO public.products (name, price, category) VALUES ('Invalid NaN', 'NaN', 'Teste');
        RAISE EXCEPTION 'NaN was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        PERFORM 1 FROM public.audit_logs LIMIT 1;
        RAISE EXCEPTION 'Runtime can read restricted audit logs';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    EXECUTE 'RESET ROLE';
    IF (SELECT count(*) FROM public.audit_logs WHERE entity_id = product_id) <> 3 THEN
        RAISE EXCEPTION 'Expected INSERT, UPDATE and DELETE audit records';
    END IF;
    BEGIN
        UPDATE public.audit_logs SET details = 'tampered' WHERE entity_id = product_id;
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Audit update was accepted';
    EXCEPTION WHEN raise_exception THEN NULL;
    END;
END $$;

-- A JWT claim is not a grant: the unrelated Supabase API role still cannot read credentials.
SET LOCAL ROLE authenticated;
DO $$ BEGIN
    BEGIN
        PERFORM password_hash FROM public.admin_users LIMIT 1;
        RAISE EXCEPTION 'Authenticated role can read password hashes';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        PERFORM 1 FROM public.products LIMIT 1;
        RAISE EXCEPTION 'Authenticated role can bypass Java catalog authorization';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
RESET ROLE;
ROLLBACK;
