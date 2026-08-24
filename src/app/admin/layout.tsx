import type { ReactNode } from "react";
import { ProductProvider } from "@/components/ProductProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ProductProvider>{children}</ProductProvider>;
}
