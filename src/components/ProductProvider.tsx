"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoProducts } from "@/data/demo-products";
import type { Product, ProductDraft } from "@/lib/types";

const STORAGE_KEY = "nest-and-yard-products-v1";

type ProductContextValue = {
  products: Product[];
  ready: boolean;
  addProduct: (draft: ProductDraft) => Product;
  updateProduct: (id: string, draft: ProductDraft) => void;
  deleteProduct: (id: string) => void;
  trackClick: (id: string) => void;
  resetDemo: () => void;
  replaceProducts: (products: Product[]) => void;
};

const ProductContext = createContext<ProductContextValue | null>(null);

function save(products: Product[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Product[];
        if (Array.isArray(parsed)) setProducts(parsed);
      }
    } catch {
      setProducts(demoProducts);
    } finally {
      setReady(true);
    }
  }, []);

  const apply = useCallback((updater: (current: Product[]) => Product[]) => {
    setProducts((current) => {
      const next = updater(current);
      save(next);
      return next;
    });
  }, []);

  const addProduct = useCallback(
    (draft: ProductDraft) => {
      const product: Product = {
        ...draft,
        id: `ny-${Date.now()}`,
        createdAt: new Date().toISOString(),
        clicks: 0,
      };
      apply((current) => [product, ...current]);
      return product;
    },
    [apply],
  );

  const updateProduct = useCallback(
    (id: string, draft: ProductDraft) => {
      apply((current) =>
        current.map((product) => (product.id === id ? { ...product, ...draft } : product)),
      );
    },
    [apply],
  );

  const deleteProduct = useCallback(
    (id: string) => apply((current) => current.filter((product) => product.id !== id)),
    [apply],
  );

  const trackClick = useCallback(
    (id: string) => {
      apply((current) =>
        current.map((product) =>
          product.id === id ? { ...product, clicks: product.clicks + 1 } : product,
        ),
      );
    },
    [apply],
  );

  const resetDemo = useCallback(() => {
    setProducts(demoProducts);
    save(demoProducts);
  }, []);

  const replaceProducts = useCallback((nextProducts: Product[]) => {
    setProducts(nextProducts);
    save(nextProducts);
  }, []);

  const value = useMemo(
    () => ({
      products,
      ready,
      addProduct,
      updateProduct,
      deleteProduct,
      trackClick,
      resetDemo,
      replaceProducts,
    }),
    [products, ready, addProduct, updateProduct, deleteProduct, trackClick, resetDemo, replaceProducts],
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used inside ProductProvider");
  return context;
}
