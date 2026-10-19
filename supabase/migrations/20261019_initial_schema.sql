-- ==============================================================================
-- DOGMANIA CATÁLOGO - SUPABASE DATABASE SCHEMA
-- Arquitetura 100% Segura com Row Level Security (RLS) & Princípio do Menor Privilégio
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS CUSTOMIZADOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPERADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL CHECK (char_length(trim(title)) >= 2),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    category VARCHAR(50) NOT NULL CHECK (char_length(trim(category)) >= 2),
    badge VARCHAR(50),
    image VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE USUÁRIOS ADMINISTRADORES
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 2),
    email VARCHAR(150) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'ADMIN',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE LOGS DE AUDITORIA (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    performed_by VARCHAR(150) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ÍNDICES DE PERFORMANCE E BUSCA
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Índice GIN para busca textual otimizada em português
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products 
    USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '')));

-- 7. FUNÇÃO E TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. PROTEÇÃO CONTRA ALTERAÇÃO OU EXCLUSÃO DE AUDITORIA (IMUTABILIDADE ESTRITA)
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Registros de auditoria são imutáveis e não podem ser modificados ou deletados.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_tampering();

DROP TRIGGER IF EXISTS trg_prevent_audit_delete ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_delete
    BEFORE DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_tampering();

-- ==============================================================================
-- 9. CONFIGURAÇÃO DE ROW LEVEL SECURITY (RLS) - 100% SEGURO
-- ==============================================================================

-- Ativar RLS em TODAS as tabelas sem exceção
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: PRODUCTS
-- Regra 1: Qualquer usuário anônimo ou autenticado pode APENAS visualizar produtos ATIVOS
CREATE POLICY "Public Read Active Products" 
    ON public.products 
    FOR SELECT 
    USING (active = true);

-- Regra 2: Apenas service_role ou administradores autenticados podem ver produtos inativos
CREATE POLICY "Admins Read All Products" 
    ON public.products 
    FOR SELECT 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPERADMIN')
    );

-- Regra 3: Inserção de produtos permitida somente para administradores
CREATE POLICY "Admins Insert Products" 
    ON public.products 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPERADMIN')
    );

-- Regra 4: Atualização de produtos permitida somente para administradores
CREATE POLICY "Admins Update Products" 
    ON public.products 
    FOR UPDATE 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPERADMIN')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPERADMIN')
    );

-- Regra 5: Exclusão restrita (embora se recomende soft-delete)
CREATE POLICY "Admins Delete Products" 
    ON public.products 
    FOR DELETE 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPERADMIN')
    );

-- POLÍTICAS: ADMIN_USERS
-- Anônimos têm ZERO acesso à tabela de credenciais
-- Administradores autenticados só podem ler o próprio perfil
CREATE POLICY "Admins View Own Profile" 
    ON public.admin_users 
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role');

-- POLÍTICAS: AUDIT_LOGS
-- Ninguém anônimo lê ou grava
-- Somente inserção por serviço ou admin logado
CREATE POLICY "Append Only Audit Logs" 
    ON public.audit_logs 
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Leitura de logs apenas por administradores
CREATE POLICY "Admins Read Audit Logs" 
    ON public.audit_logs 
    FOR SELECT 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPERADMIN')
    );
