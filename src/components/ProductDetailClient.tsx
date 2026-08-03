"use client";

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowIcon, BagIcon, LeafIcon } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { useProducts } from "@/components/ProductProvider";

function formatPrice(value: number | null) {
  if (value === null) return "Sprawdź cenę na Allegro";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(value);
}

function safeAllegroUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && (parsed.hostname === "allegro.pl" || parsed.hostname.endsWith(".allegro.pl"));
  } catch {
    return false;
  }
}

export function ProductDetailClient({ slug }: { slug: string }) {
  const { products, ready, trackClick } = useProducts();
  const product = products.find((item) => item.slug === slug && item.published);

  if (!ready) {
    return <><Header /><main className="loading-page">Ładowanie produktu…</main><Footer /></>;
  }

  if (!product) {
    return (
      <><Header /><main className="not-found-page"><p className="eyebrow">Nest & Yard</p><h1>Nie znaleźliśmy tego produktu.</h1><Link className="button button-dark" href="/">Wróć do kolekcji</Link></main><Footer /></>
    );
  }

  const related = products.filter((item) => item.published && item.id !== product.id && item.categorySlug === product.categorySlug).slice(0, 3);
  const canBuy = safeAllegroUrl(product.allegroUrl);

  return (
    <>
      <Header />
      <main className="product-page">
        <div className="breadcrumbs"><Link href="/">Strona główna</Link><span>/</span><Link href={`/kategoria/${product.categorySlug}`}>{product.category}</Link><span>/</span><strong>{product.name}</strong></div>
        <section className="product-detail">
          <div className="product-detail-visual">
            {product.badge ? <span className="product-badge large-badge">{product.badge}</span> : null}
            <ProductVisual product={product} />
            <div className="visual-caption"><LeafIcon /><span>Wybrane przez Nest & Yard</span></div>
          </div>
          <div className="product-detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="detail-lead">{product.shortDescription}</p>
            <div className="detail-price"><strong>{formatPrice(product.price)}</strong>{product.oldPrice ? <span>{formatPrice(product.oldPrice)}</span> : null}</div>
            <p className="detail-description">{product.description}</p>
            <dl className="product-specs">
              <div><dt>Materiał</dt><dd>{product.material || "Sprawdź w ofercie"}</dd></div>
              <div><dt>Wymiary</dt><dd>{product.dimensions || "Sprawdź w ofercie"}</dd></div>
              <div><dt>Kolor</dt><dd>{product.color || "Sprawdź w ofercie"}</dd></div>
            </dl>
            {canBuy ? (
              <a className="button button-allegro" href={product.allegroUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(product.id)}>
                <BagIcon /> Kup na Allegro <ArrowIcon />
              </a>
            ) : (
              <button className="button button-disabled" type="button" disabled>Oferta chwilowo niedostępna</button>
            )}
            <p className="external-note">Po kliknięciu przejdziesz do zewnętrznej oferty. Cena, dostępność, dostawa i płatność są obsługiwane przez Allegro.</p>
          </div>
        </section>

        <section className="detail-story">
          <div><p className="eyebrow">Dobry wybór</p><h2>Forma, która nie<br /><em>wychodzi z mody.</em></h2></div>
          <div><p>Stawiamy na spokojne proporcje i rzeczy, które łatwo połączyć z tym, co już masz. Produkt ma uzupełniać przestrzeń, a nie ją przytłaczać.</p><Link className="text-link" href={`/kategoria/${product.categorySlug}`}>Zobacz całą kolekcję <ArrowIcon /></Link></div>
        </section>

        {related.length ? (
          <section className="section related-section"><div className="section-heading products-heading"><div><p className="eyebrow">Może również pasować</p><h2>Z tej samej<br /><em>kolekcji.</em></h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
