-- Optional subcategory: preserves products created before this feature.
BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory varchar(80);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.products'::regclass AND conname='products_subcategory_length') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_subcategory_length
      CHECK (subcategory IS NULL OR char_length(trim(subcategory)) BETWEEN 2 AND 80);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_active_subcategory
  ON public.products(category, subcategory) WHERE active;

-- Only known demonstration records, with exact id/name and no classification yet.
UPDATE public.products AS p SET subcategory=v.subcategory
FROM (VALUES
 ('e9957b23-71c2-4c9e-ad6a-d25702b0d634'::uuid,'[EXEMPLO] Ração para cães adultos 10 kg','Ração para cães'),
 ('7a83efdd-e57b-4d80-9f81-e88f5bf999a2'::uuid,'[EXEMPLO] Ração para gatos castrados 1 kg','Ração'),
 ('09c80bab-5f2f-4c8d-bd97-ab55af3b4313'::uuid,'[EXEMPLO] Bola mordedor para cães','Brinquedos para cães'),
 ('6694041c-ac79-4353-8d22-1b8253fc9b78'::uuid,'[EXEMPLO] Shampoo neutro para pets 500 ml','Shampoos e Condicionadores'),
 ('ca357320-1e50-4fa6-804a-79c6e5158ef4'::uuid,'[EXEMPLO] Coleira ajustável para cães','Coleiras, Guias e Peitorais'),
 ('5973574f-5156-4d72-bffe-a29590025546'::uuid,'[EXEMPLO] Areia higiênica para gatos 4 kg','Areias e Banheiros')
) AS v(id,name,subcategory)
WHERE p.id=v.id AND p.name=v.name AND p.subcategory IS NULL;
COMMIT;
