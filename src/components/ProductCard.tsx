"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { ArrowIcon } from "@/components/Icons";
import { ProductVisual } from "@/components/ProductVisual";

function formatPrice(value: number | null) {
  if (value === null) return "Cena na Allegro";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(value);
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/produkt/${product.slug}`} className="product-card-image" aria-label={`Zobacz ${product.name}`}>
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <ProductVisual product={product} />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3><Link href={`/produkt/${product.slug}`}>{product.name}</Link></h3>
        <p className="product-card-copy">{product.shortDescription}</p>
        <div className="product-card-footer">
          <div className="price-line">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice ? <span>{formatPrice(product.oldPrice)}</span> : null}
          </div>
          <Link className="round-arrow" href={`/produkt/${product.slug}`} aria-label={`Zobacz produkt ${product.name}`}>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
