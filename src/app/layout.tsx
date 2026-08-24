import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ProductProvider } from "@/components/ProductProvider";

export const metadata: Metadata = {
  title: "VignetteGO — Winiety na podróż po Europie",
  description: "Kup elektroniczne winiety drogowe w jednym prostym miejscu.",
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
