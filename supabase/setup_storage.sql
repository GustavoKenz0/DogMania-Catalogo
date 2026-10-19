-- Optional Supabase Storage setup. Run as migration operator after reviewing
-- existing Storage policies; never run this with the browser's public key.
-- Uploads go through the authenticated Java endpoint using a server-only key.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No client INSERT/UPDATE/DELETE policies are created. Public image URLs are
-- intentionally readable. The service role uploads from Java only.
COMMIT;
