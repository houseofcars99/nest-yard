"use client";

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowIcon } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/components/ProductProvider";

export function CategoryClient({ slug }: { slug: string }) {
  const { products, ready } = useProducts();
  const all = products.filter((product) => product.published);
  const filtered = slug === "wszystkie" ? all : all.filter((product) => product.categorySlug === slug);
  const title = filtered[0]?.category ?? (slug === "wszystkie" ? "Wszystkie produkty" : "Kolekcja");

  return (
    <>
      <Header />
      <main className="catalog-page">
        <section className="catalog-hero">
          <p className="eyebrow">Nest & Yard collection</p>
          <h1>{title}</h1>
          <p>Spokojne formy, praktyczne materiały i bezpośrednie przejście do aktualnej oferty Allegro.</p>
          <Link className="back-link" href="/"><ArrowIcon /> Wróć na stronę główną</Link>
        </section>
        <section className="section catalog-products">
          <div className="catalog-toolbar"><span>{filtered.length} produktów</span><span>Zakup realizowany na Allegro</span></div>
          {!ready ? <p>Ładowanie…</p> : null}
          {ready && filtered.length === 0 ? (
            <div className="empty-state"><h2>Ta kolekcja jest jeszcze pusta.</h2><p>Produkty można dodać i opublikować w panelu administratora.</p><Link className="button button-dark" href="/admin">Otwórz panel</Link></div>
          ) : null}
          <div className="product-grid catalog-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
