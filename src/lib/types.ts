export type ProductPalette = "sage" | "clay" | "sky" | "butter" | "plum" | "forest";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  allegroUrl: string;
  allegroOfferId?: string;
  sku?: string;
  stock?: number | null;
  purchasePrice?: number | null;
  vatRate?: number;
  imageUrl: string;
  palette: ProductPalette;
  badge: string;
  featured: boolean;
  published: boolean;
  material: string;
  dimensions: string;
  color: string;
  createdAt: string;
  clicks: number;
};

export type ProductDraft = Omit<Product, "id" | "createdAt" | "clicks">;
