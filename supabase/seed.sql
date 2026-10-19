-- Development catalog only. No administrator or shared password is created.
-- Apply both migrations first. Run once in an empty development database only.

INSERT INTO public.products (name, description, price, category, badge, image, active) VALUES
('Ração Premier Raças Específicas Golden Retriever Adultos 12kg', 'Alimento Super Premium formulado para atender às necessidades específicas da raça Golden Retriever.', 289.90, 'Rações', 'Mais Vendido', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80', true),
('Ração Royal Canin Mini Adult para Cães Adultos de Pequeno Porte 7,5kg', 'Nutrição completa para cães adultos de porte pequeno (peso de 1 a 10 kg) a partir dos 10 meses.', 219.90, 'Rações', 'Destaque', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80', true),
('Brinquedo Mordedor Nylon Resistente Sabor Frango', 'Excelente para cães com mordida forte. Auxilia na limpeza dos dentes e combate o estresse.', 42.90, 'Brinquedos', 'Recomendado', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&auto=format&fit=crop&q=80', true),
('Cama Pet Almofadada Impermeável Tamanho G', 'Máximo conforto com tecido impermeável e lavável. Espuma de alta densidade.', 179.90, 'Acessórios', 'Conforto', 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&auto=format&fit=crop&q=80', true),
('Shampoo Antipulgas e Carrapatos Sanol Dog 500ml', 'Elimina e previne ectoparasitas com fórmula suave enriquecida com queratina.', 34.50, 'Farmácia', 'Essencial', 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600&auto=format&fit=crop&q=80', true),
('Petisco Bifinho de Carne Supreme 500g', 'Snack suculento rico em proteínas. Perfeito para adestramento e recompensas.', 24.90, 'Petiscos', 'Novidade', 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&auto=format&fit=crop&q=80', true)
ON CONFLICT DO NOTHING;
