"use client";

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowIcon, LeafIcon, PawIcon } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { useProducts } from "@/components/ProductProvider";

const categories = [
  {
    name: "Meble ogrodowe",
    slug: "meble-ogrodowe",
    copy: "Wygodne formy na taras i do ogrodu.",
    className: "category-sage",
    symbol: "01",
  },
  {
    name: "Pergole i zadaszenia",
    slug: "pergole-i-zadaszenia",
    copy: "Architektura dla spokojnej strefy odpoczynku.",
    className: "category-sky",
    symbol: "02",
  },
  {
    name: "Donice i dekoracje",
    slug: "donice-i-dekoracje",
    copy: "Detale, które porządkują i ocieplają przestrzeń.",
    className: "category-clay",
    symbol: "03",
  },
  {
    name: "Dla zwierząt",
    slug: "dla-zwierzat",
    copy: "Komfort pupila bez kompromisu dla wnętrza.",
    className: "category-butter",
    symbol: "04",
  },
];

export function HomeClient() {
  const { products, ready } = useProducts();
  const visibleProducts = products.filter((product) => product.published);
  const featured = visibleProducts.filter((product) => product.featured).slice(0, 4);
  const heroProduct = featured[0] ?? visibleProducts[0];

  return (
    <>
      <Header />
      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span /> Dom zaczyna się także za progiem</p>
            <h1>Piękniej<br /><em>na zewnątrz.</em></h1>
            <p className="hero-intro">
              Meble, pergole, dekoracje i akcesoria dla zwierząt wybrane tak, by tworzyły spójną, spokojną przestrzeń.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" href="#produkty">Odkryj produkty <ArrowIcon /></Link>
              <Link className="text-link" href="#jak-to-dziala">Jak kupować?</Link>
            </div>
            <div className="hero-proof">
              <div><strong>01</strong><span>Selekcja zamiast przypadkowej oferty</span></div>
              <div><strong>02</strong><span>Zakup bezpośrednio i bezpiecznie na Allegro</span></div>
            </div>
          </div>

          <div className="hero-art" aria-label="Wyróżniony produkt Nest & Yard">
            <div className="hero-art-label">Nest & Yard<br />selection</div>
            <span className="hero-dot hero-dot-one" />
            <span className="hero-dot hero-dot-two" />
            {heroProduct ? <ProductVisual product={heroProduct} className="hero-product-visual" /> : null}
            <div className="hero-stamp"><LeafIcon /><span>curated<br />outdoor living</span></div>
            <div className="hero-note">Naturalne odcienie<br />· miękkie linie ·</div>
          </div>
        </section>

        <section className="marquee" aria-label="Kategorie produktów">
          <div>ogród <span>✦</span> taras <span>✦</span> dom <span>✦</span> zwierzęta <span>✦</span> odpoczynek <span>✦</span></div>
        </section>

        <section className="section collection-section" id="kolekcje">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Kolekcje</p>
              <h2>Znajdź swój<br /><em>ulubiony kąt.</em></h2>
            </div>
            <p>Od dużych zmian po jeden dobry detal. Wybierz kategorię i zobacz produkty dostępne w aktualnych ofertach Allegro.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.slug} href={`/kategoria/${category.slug}`} className={`category-card ${category.className}`}>
                <span className="category-number">{category.symbol}</span>
                <div className="category-shape"><span /><span /><span /></div>
                <div className="category-copy">
                  <h3>{category.name}</h3>
                  <p>{category.copy}</p>
                </div>
                <span className="round-arrow"><ArrowIcon /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section products-section" id="produkty">
          <div className="section-heading products-heading">
            <div>
              <p className="eyebrow">Wybrane dla Ciebie</p>
              <h2>Rzeczy z dobrym<br /><em>wyczuciem miejsca.</em></h2>
            </div>
            <Link className="button button-outline" href="/kategoria/wszystkie">Zobacz wszystko <ArrowIcon /></Link>
          </div>
          {!ready ? <p className="loading-state">Ładowanie kolekcji…</p> : null}
          <div className="product-grid">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-art">
            <span className="editorial-sun" />
            <div className="editorial-chair">
              <span className="chair-back" />
              <span className="chair-seat" />
              <span className="chair-leg chair-leg-a" />
              <span className="chair-leg chair-leg-b" />
            </div>
            <div className="editorial-plant"><span /><i /><i /><i /></div>
            <p>less rush<br />more room</p>
          </div>
          <div className="editorial-copy">
            <p className="eyebrow">Nasza zasada</p>
            <h2>Nie więcej rzeczy.<br /><em>Lepsze rzeczy.</em></h2>
            <p>
              Nest & Yard porządkuje ofertę i pokazuje produkty, które łatwo połączyć w jedną estetyczną całość. Bez przeładowania, bez przypadkowych wyborów.
            </p>
            <div className="editorial-points">
              <div><strong>01</strong><span>Spójne kolory i naturalne materiały</span></div>
              <div><strong>02</strong><span>Praktyczne produkty do codziennego użytkowania</span></div>
              <div><strong>03</strong><span>Aktualne oferty podpięte bezpośrednio z Allegro</span></div>
            </div>
          </div>
        </section>

        <section className="how-section" id="jak-to-dziala">
          <div className="how-heading">
            <p className="eyebrow">Prosty zakup</p>
            <h2>Od inspiracji<br /><em>do Allegro.</em></h2>
          </div>
          <div className="how-steps">
            <article><span>1</span><h3>Oglądasz</h3><p>Przeglądasz wyselekcjonowane produkty i ich najważniejsze parametry.</p></article>
            <article><span>2</span><h3>Wybierasz</h3><p>Na karcie produktu klikasz przycisk „Kup na Allegro”.</p></article>
            <article><span>3</span><h3>Kupujesz</h3><p>Finalizujesz zakup, płatność i dostawę bezpośrednio w serwisie Allegro.</p></article>
          </div>
          <div className="allegro-banner">
            <PawIcon />
            <div><strong>Bez dodatkowego konta i nowego koszyka.</strong><span>Nest & Yard pomaga znaleźć produkt, a transakcję chroni Allegro.</span></div>
            <Link className="button button-light" href="#produkty">Przejdź do produktów <ArrowIcon /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
