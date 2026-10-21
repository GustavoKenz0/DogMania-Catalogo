export const CATEGORIES = [
  "Cães",
  "Gatos",
  "Pássaros",
  "Peixes",
  "Outros Pets",
  "Rações",
  "Higiene",
  "Brinquedos",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CatalogCategory = Category | "Todos";

export const isCategory = (value: unknown): value is Category =>
  typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  subcategory?: string;
  image: string;
  badge?: string;
  description: string;
  active?: boolean;
}
