import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ProductProvider } from "@/components/ProductProvider";

export const metadata: Metadata = {
  title: "Nest & Yard — dom, ogród i zwierzęta",
  description: "Starannie wybrane meble, dekoracje, pergole i akcesoria. Kupuj bezpiecznie przez Allegro.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <ProductProvider>{children}</ProductProvider>
      </body>
    </html>
  );
}
