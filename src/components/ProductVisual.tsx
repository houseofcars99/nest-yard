"use client";

import type { Product } from "@/lib/types";

type Props = {
  product: Pick<Product, "name" | "categorySlug" | "imageUrl" | "palette">;
  className?: string;
};

function Illustration({ category }: { category: string }) {
  if (category.includes("zwierzat")) {
    return (
      <svg className="product-illustration" viewBox="0 0 520 420" role="img" aria-label="Ilustracja legowiska dla zwierząt">
        <ellipse cx="260" cy="334" rx="160" ry="30" fill="rgba(16,40,31,.13)" />
        <path d="M116 278c0-78 57-135 144-135s144 57 144 135c0 44-35 70-78 70H194c-43 0-78-26-78-70Z" fill="#f1dcae" stroke="#203d34" strokeWidth="9" />
        <ellipse cx="260" cy="267" rx="103" ry="58" fill="#fff8eb" stroke="#203d34" strokeWidth="8" />
        <path d="M215 232c22-22 68-22 90 0" stroke="#c77b5b" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }
  if (category.includes("pergole")) {
    return (
      <svg className="product-illustration" viewBox="0 0 520 420" role="img" aria-label="Ilustracja pergoli">
        <ellipse cx="260" cy="350" rx="180" ry="24" fill="rgba(16,40,31,.13)" />
        <path d="M105 116h310M125 116v230M395 116v230" stroke="#203d34" strokeWidth="12" strokeLinecap="round" />
        <path d="M120 145h280M120 175h280M120 205h280" stroke="#718f88" strokeWidth="9" strokeLinecap="round" />
        <rect x="170" y="265" width="180" height="58" rx="20" fill="#fff8eb" stroke="#203d34" strokeWidth="8" />
      </svg>
    );
  }
  if (category.includes("donice")) {
    return (
      <svg className="product-illustration" viewBox="0 0 520 420" role="img" aria-label="Ilustracja donicy">
        <ellipse cx="260" cy="350" rx="125" ry="25" fill="rgba(16,40,31,.13)" />
        <path d="M180 166h160l-24 172H204l-24-172Z" fill="#e5b59e" stroke="#203d34" strokeWidth="9" />
        <ellipse cx="260" cy="166" rx="82" ry="23" fill="#f2cbb8" stroke="#203d34" strokeWidth="8" />
        <path d="M260 153c-8-63 37-104 87-113-4 58-33 102-87 113Z" fill="#7ca58a" stroke="#203d34" strokeWidth="7" />
        <path d="M257 155c-49-8-82-47-87-96 48 5 83 38 87 96Z" fill="#a9c6a7" stroke="#203d34" strokeWidth="7" />
      </svg>
    );
  }
  if (category.includes("akcesoria")) {
    return (
      <svg className="product-illustration" viewBox="0 0 520 420" role="img" aria-label="Ilustracja lampionu">
        <ellipse cx="260" cy="350" rx="125" ry="25" fill="rgba(16,40,31,.13)" />
        <path d="M190 130h140l24 205H166l24-205Z" fill="#714457" stroke="#203d34" strokeWidth="9" />
        <rect x="202" y="153" width="116" height="150" rx="8" fill="#fae9be" stroke="#203d34" strokeWidth="7" />
        <path d="M220 275c19-37 32-53 42-83 17 31 30 49 40 83-24 17-58 17-82 0Z" fill="#d8844f" />
        <path d="M208 130c0-54 25-82 52-82s52 28 52 82" stroke="#203d34" strokeWidth="9" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="product-illustration" viewBox="0 0 520 420" role="img" aria-label="Ilustracja mebla ogrodowego">
      <ellipse cx="260" cy="350" rx="175" ry="26" fill="rgba(16,40,31,.13)" />
      <path d="M145 230c0-62 43-108 98-108h34c55 0 98 46 98 108v83H145v-83Z" fill="#d7e2d1" stroke="#203d34" strokeWidth="9" />
      <rect x="162" y="234" width="196" height="85" rx="30" fill="#fff8eb" stroke="#203d34" strokeWidth="8" />
      <path d="M171 317l-18 33M349 317l18 33" stroke="#203d34" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export function ProductVisual({ product, className = "" }: Props) {
  return (
    <div className={`product-visual palette-${product.palette} ${className}`}>
      <span className="visual-orbit visual-orbit-one" />
      <span className="visual-orbit visual-orbit-two" />
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="product-photo" src={product.imageUrl} alt={product.name} />
      ) : (
        <Illustration category={product.categorySlug} />
      )}
    </div>
  );
}
