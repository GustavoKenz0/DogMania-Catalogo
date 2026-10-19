export type Category = "Cães" | "Gatos" | "Higiene" | "Brinquedos" | "Rações";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  badge?: string;
  description: string;
  active?: boolean;
}

export const CATEGORIES: Category[] = ["Cães", "Gatos", "Higiene", "Brinquedos", "Rações"];
