import type { CatalogCategory, Category, Product } from "./model";

export interface Subcategory {
  label: string;
  key: string;
  related: readonly Category[];
  groups: readonly string[];
}
const item = (
  label: string,
  key: string,
  related: Category[] = [],
  groups: string[] = [],
): Subcategory => ({ label, key, related, groups });

// Shared keys connect explicit animal/departament classifications, never name guesses.
export const SUBCATEGORIES: Record<Category, readonly Subcategory[]> = {
  Cães: [
    item("Ração", "racao-caes", ["Rações"]),
    item("Petiscos e Ossos", "petiscos-caes", ["Rações"]),
    item("Tapetes, Fraldas e Banheiros", "tapetes-caes", ["Higiene"]),
    item("Farmácia", "farmacia-caes"),
    item("Brinquedos", "brinquedos-caes", ["Brinquedos"]),
    item("Coleiras, Guias e Peitorais", "passeio-caes"),
    item("Beleza e Limpeza", "higiene-caes", ["Higiene"]),
    item("Camas e Cobertores", "camas-caes"),
    item("Casas e Tocas", "casas-caes"),
    item("Acessórios de Alimentação", "alimentacao-caes"),
    item("Acessórios de Transporte", "transporte-caes"),
    item("Portões, Grades e Escadas", "seguranca-caes"),
    item("Roupas", "roupas-caes"),
  ],
  Gatos: [
    item("Ração", "racao-gatos", ["Rações"]),
    item("Petiscos", "petiscos-gatos", ["Rações"]),
    item("Areias e Banheiros", "areias-gatos", ["Higiene"]),
    item("Farmácia", "farmacia-gatos"),
    item("Brinquedos e Arranhadores", "brinquedos-gatos", ["Brinquedos"]),
    item("Coleiras, Guias e Peitorais", "passeio-gatos"),
    item("Beleza e Limpeza", "higiene-gatos", ["Higiene"]),
    item("Camas e Cobertores", "camas-gatos"),
    item("Casas e Tocas", "casas-gatos"),
    item("Acessórios de Alimentação", "alimentacao-gatos"),
    item("Caixas de Transporte", "transporte-gatos"),
    item("Telas e Proteção", "seguranca-gatos"),
  ],
  Pássaros: [
    item("Rações e Sementes", "racao-passaros", ["Rações"]),
    item("Petiscos e Frutas", "petiscos-passaros", ["Rações"]),
    item("Gaiolas e Viveiros", "gaiolas-passaros"),
    item("Brinquedos e Poleiros", "brinquedos-passaros", ["Brinquedos"]),
    item("Comedouros e Bebedouros", "alimentacao-passaros"),
    item("Higiene e Limpeza", "higiene-passaros", ["Higiene"]),
    item("Saúde e Suplementos", "saude-passaros"),
    item("Acessórios de Transporte", "transporte-passaros"),
  ],
  Peixes: [
    item("Ração", "racao-peixes", ["Rações"]),
    item("Aquários e Beteiras", "aquarios-peixes"),
    item("Filtros e Bombas", "filtros-peixes"),
    item("Decoração e Plantas", "decoracao-peixes"),
    item("Substratos e Cascalhos", "substratos-peixes"),
    item("Iluminação e Aquecimento", "iluminacao-peixes"),
    item("Tratamento da Água", "higiene-peixes", ["Higiene"]),
    item("Saúde e Cuidados", "saude-peixes"),
    item("Acessórios de Alimentação", "alimentacao-peixes"),
  ],
  "Outros Pets": [
    item("Rações e Alimentos", "racao-outros", ["Rações"]),
    item("Petiscos", "petiscos-outros", ["Rações"]),
    item("Gaiolas, Cercados e Terrários", "casas-outros"),
    item("Camas, Tocas e Ninhos", "camas-outros"),
    item("Brinquedos e Exercício", "brinquedos-outros", ["Brinquedos"]),
    item("Higiene e Forração", "higiene-outros", ["Higiene"]),
    item("Comedouros e Bebedouros", "alimentacao-outros"),
    item("Saúde e Suplementos", "saude-outros"),
    item("Acessórios de Transporte", "transporte-outros"),
  ],
  Rações: [
    item("Ração para cães", "racao-caes", ["Cães"]),
    item("Ração para gatos", "racao-gatos", ["Gatos"]),
    item("Rações e Sementes para pássaros", "racao-passaros", ["Pássaros"]),
    item("Ração para peixes", "racao-peixes", ["Peixes"]),
    item("Alimentos para outros pets", "racao-outros", ["Outros Pets"]),
    item("Petiscos e Ossos para cães", "petiscos-caes", ["Cães"]),
    item("Petiscos para gatos", "petiscos-gatos", ["Gatos"]),
    item("Petiscos para pássaros", "petiscos-passaros", ["Pássaros"]),
    item("Petiscos para outros pets", "petiscos-outros", ["Outros Pets"]),
  ],
  Higiene: [
    item(
      "Shampoos e Condicionadores",
      "shampoo-pets",
      ["Cães", "Gatos"],
      ["higiene-caes", "higiene-gatos"],
    ),
    item("Escovas e Pentes", "escovas-pets", ["Cães", "Gatos"], ["higiene-caes", "higiene-gatos"]),
    item("Tapetes, Fraldas e Banheiros", "tapetes-caes", ["Cães"]),
    item("Areias e Banheiros", "areias-gatos", ["Gatos"]),
    item("Higiene Bucal", "higiene-bucal", ["Cães", "Gatos"], ["higiene-caes", "higiene-gatos"]),
    item("Limpeza de Ambientes", "limpeza-ambientes"),
    item("Higiene para pássaros", "higiene-passaros", ["Pássaros"]),
    item("Tratamento da Água", "higiene-peixes", ["Peixes"]),
    item("Higiene e Forração para outros pets", "higiene-outros", ["Outros Pets"]),
  ],
  Brinquedos: [
    item("Brinquedos para cães", "brinquedos-caes", ["Cães"]),
    item("Brinquedos e Arranhadores para gatos", "brinquedos-gatos", ["Gatos"]),
    item("Brinquedos e Poleiros para pássaros", "brinquedos-passaros", ["Pássaros"]),
    item("Brinquedos e Exercício para outros pets", "brinquedos-outros", ["Outros Pets"]),
  ],
};

export function getSubcategories(category: CatalogCategory): readonly Subcategory[] {
  return category === "Todos" ? [] : (SUBCATEGORIES[category] ?? []);
}
export function isSubcategory(category: CatalogCategory, value: unknown): value is string {
  return (
    typeof value === "string" && getSubcategories(category).some((entry) => entry.label === value)
  );
}
export function matchesCatalogCategory(
  product: Product,
  category: CatalogCategory,
  subcategory?: string,
): boolean {
  if (category === "Todos") return true;
  const classified = getSubcategories(product.category).find(
    (entry) => entry.label === product.subcategory,
  );
  if (subcategory) {
    const selected = getSubcategories(category).find((entry) => entry.label === subcategory);
    return (
      !!selected &&
      !!classified &&
      (classified.key === selected.key || classified.groups.includes(selected.key))
    );
  }
  return product.category === category || !!classified?.related.includes(category);
}
