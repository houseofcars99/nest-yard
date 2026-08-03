"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowIcon, BagIcon } from "@/components/Icons";
import { ProductVisual } from "@/components/ProductVisual";
import { AdminOperations } from "@/components/AdminOperations";
import { useProducts } from "@/components/ProductProvider";
import type { Product, ProductDraft, ProductPalette } from "@/lib/types";

const SESSION_KEY = "nest-and-yard-admin-session";
const DEMO_PASSWORD = "nest-demo";

const categoryOptions = [
  ["Meble ogrodowe", "meble-ogrodowe"],
  ["Pergole i zadaszenia", "pergole-i-zadaszenia"],
  ["Donice i dekoracje", "donice-i-dekoracje"],
  ["Akcesoria ogrodowe", "akcesoria-ogrodowe"],
  ["Dla zwierząt", "dla-zwierzat"],
] as const;

const paletteOptions: { value: ProductPalette; label: string }[] = [
  { value: "sage", label: "Szałwia" },
  { value: "clay", label: "Terakota" },
  { value: "sky", label: "Błękit" },
  { value: "butter", label: "Wanilia" },
  { value: "plum", label: "Śliwka" },
  { value: "forest", label: "Leśna zieleń" },
];

const emptyDraft: ProductDraft = {
  slug: "",
  name: "",
  category: "Meble ogrodowe",
  categorySlug: "meble-ogrodowe",
  shortDescription: "",
  description: "",
  price: null,
  oldPrice: null,
  allegroUrl: "",
  allegroOfferId: "",
  sku: "",
  stock: null,
  purchasePrice: null,
  vatRate: 23,
  imageUrl: "",
  palette: "sage",
  badge: "",
  featured: false,
  published: true,
  material: "",
  dimensions: "",
  color: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isAllegroUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "allegro.pl" || url.hostname.endsWith(".allegro.pl"));
  } catch {
    return false;
  }
}

function toDraft(product: Product): ProductDraft {
  const { id: _id, createdAt: _createdAt, clicks: _clicks, ...draft } = product;
  return draft;
}

function formatPrice(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(value);
}

export function AdminClient() {
  const { products, addProduct, updateProduct, deleteProduct, resetDemo, replaceProducts } = useProducts();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAuthorized(window.sessionStorage.getItem(SESSION_KEY) === "yes");
  }, []);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      `${product.name} ${product.category} ${product.badge}`.toLowerCase().includes(query),
    );
  }, [products, search]);

  const totalClicks = products.reduce((sum, product) => sum + product.clicks, 0);
  const publishedCount = products.filter((product) => product.published).length;
  const linkedCount = products.filter((product) => isAllegroUrl(product.allegroUrl)).length;

  function login(event: FormEvent) {
    event.preventDefault();
    if (password === DEMO_PASSWORD) {
      window.sessionStorage.setItem(SESSION_KEY, "yes");
      setAuthorized(true);
      setLoginError("");
    } else {
      setLoginError("Nieprawidłowe hasło demonstracyjne.");
    }
  }

  function logout() {
    window.sessionStorage.removeItem(SESSION_KEY);
    setAuthorized(false);
    setPassword("");
  }

  function setField<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft);
    setFormOpen(true);
    setNotice("");
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setDraft(toDraft(product));
    setFormOpen(true);
    setNotice("");
  }

  function saveProduct(event: FormEvent) {
    event.preventDefault();
    const normalized: ProductDraft = {
      ...draft,
      name: draft.name.trim(),
      slug: (draft.slug || slugify(draft.name)).trim(),
      shortDescription: draft.shortDescription.trim(),
      description: draft.description.trim(),
      allegroUrl: draft.allegroUrl.trim(),
      allegroOfferId: draft.allegroOfferId?.trim() || "",
      sku: draft.sku?.trim().toUpperCase() || "",
      stock: draft.stock ?? null,
      purchasePrice: draft.purchasePrice ?? null,
      vatRate: draft.vatRate ?? 23,
      imageUrl: draft.imageUrl.trim(),
      badge: draft.badge.trim(),
      material: draft.material.trim(),
      dimensions: draft.dimensions.trim(),
      color: draft.color.trim(),
    };

    if (!normalized.name || !normalized.slug || !normalized.shortDescription) {
      setNotice("Uzupełnij nazwę, adres produktu i krótki opis.");
      return;
    }
    if (normalized.allegroUrl && !isAllegroUrl(normalized.allegroUrl)) {
      setNotice("Link zakupowy musi prowadzić do bezpiecznego adresu w domenie allegro.pl.");
      return;
    }
    const duplicate = products.some((product) => product.slug === normalized.slug && product.id !== editingId);
    if (duplicate) {
      setNotice("Inny produkt ma już taki adres. Zmień slug produktu.");
      return;
    }

    if (editingId) updateProduct(editingId, normalized);
    else addProduct(normalized);

    setFormOpen(false);
    setNotice(editingId ? "Produkt został zaktualizowany." : "Produkt został dodany.");
  }

  function remove(product: Product) {
    if (window.confirm(`Usunąć produkt „${product.name}”?`)) {
      deleteProduct(product.id);
      setNotice("Produkt został usunięty.");
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nest-and-yard-products-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Kopia produktów została pobrana.");
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Product[];
      if (!Array.isArray(parsed) || parsed.some((product) => !product.id || !product.name || !product.slug)) {
        throw new Error("Invalid data");
      }
      replaceProducts(parsed);
      setNotice(`Zaimportowano ${parsed.length} produktów.`);
    } catch {
      setNotice("Nie udało się odczytać pliku. Wybierz prawidłową kopię JSON z panelu.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  if (!authorized) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <Link className="admin-brand" href="/"><span>N&Y</span>Nest <em>&</em> Yard</Link>
          <p className="eyebrow">Panel administratora</p>
          <h1>Zarządzaj katalogiem.</h1>
          <p>Wersja demonstracyjna. Dane są zapisywane lokalnie w tej przeglądarce.</p>
          <form onSubmit={login}>
            <label>Hasło demonstracyjne<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Wpisz hasło" autoFocus /></label>
            {loginError ? <p className="form-error">{loginError}</p> : null}
            <button className="button button-dark" type="submit">Otwórz panel <ArrowIcon /></button>
          </form>
          <div className="demo-password">Hasło testowe: <strong>nest-demo</strong></div>
          <Link className="back-link" href="/"><ArrowIcon /> Wróć do sklepu</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link className="admin-brand admin-brand-light" href="/"><span>N&Y</span>Nest <em>&</em> Yard</Link>
        <nav>
          <a className="active" href="#dashboard">Przegląd</a>
          <a href="#operations">Sprzedaż i Allegro</a>
          <a href="#products">Produkty</a>
          <a href="#data">Kopia danych</a>
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank">Otwórz sklep <ArrowIcon /></Link>
          <button type="button" onClick={logout}>Wyloguj</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header" id="dashboard">
          <div><p className="eyebrow">Tryb demonstracyjny</p><h1>Dzień dobry.</h1><p>Zarządzaj tym, co klienci zobaczą w katalogu Nest & Yard.</p></div>
          <button className="button button-dark" type="button" onClick={openNew}>+ Dodaj produkt</button>
        </header>

        {notice ? <div className="admin-notice">{notice}<button type="button" onClick={() => setNotice("")}>×</button></div> : null}

        <section className="admin-stats">
          <article><span>Produkty</span><strong>{products.length}</strong><small>{publishedCount} opublikowanych</small></article>
          <article><span>Linki Allegro</span><strong>{linkedCount}</strong><small>{products.length - linkedCount} wymaga uzupełnienia</small></article>
          <article><span>Kliknięcia</span><strong>{totalClicks}</strong><small>łącznie w tej przeglądarce</small></article>
          <article><span>Wyróżnione</span><strong>{products.filter((product) => product.featured).length}</strong><small>na stronie głównej</small></article>
        </section>

        <AdminOperations products={products} />

        <section className="admin-products" id="products">
          <div className="admin-section-heading"><div><h2>Produkty</h2><p>Każda karta może kierować do osobnej oferty Allegro.</p></div><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj produktu…" /></div>
          <div className="admin-product-list">
            {visibleProducts.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <ProductVisual product={product} />
                <div className="admin-product-name"><strong>{product.name}</strong><span>{product.category}</span></div>
                <div className="admin-product-price"><strong>{formatPrice(product.price)}</strong><span>{product.badge || "Bez oznaczenia"}</span></div>
                <div className="admin-product-status"><span className={product.published ? "status-dot published" : "status-dot"}>{product.published ? "Opublikowany" : "Ukryty"}</span><small>{product.clicks} kliknięć</small></div>
                <div className="admin-product-link">{isAllegroUrl(product.allegroUrl) ? <a href={product.allegroUrl} target="_blank" rel="noreferrer"><BagIcon /> Allegro</a> : <span>Brak linku</span>}</div>
                <div className="admin-row-actions"><button type="button" onClick={() => openEdit(product)}>Edytuj</button><button className="danger" type="button" onClick={() => remove(product)}>Usuń</button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-data" id="data">
          <div><h2>Kopia danych</h2><p>Eksport pozwala zachować produkty z wersji demonstracyjnej i później przenieść je do właściwej bazy.</p></div>
          <div className="admin-data-actions"><button className="button button-outline" type="button" onClick={exportData}>Eksportuj JSON</button><button className="button button-outline" type="button" onClick={() => importRef.current?.click()}>Importuj JSON</button><input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => void importData(event.target.files?.[0])} /><button className="text-button danger" type="button" onClick={() => { if (window.confirm("Przywrócić przykładowe produkty?")) { resetDemo(); setNotice("Przywrócono przykładowy katalog."); } }}>Przywróć wersję demo</button></div>
        </section>
      </div>

      {formOpen ? (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="admin-modal-header"><div><p className="eyebrow">Katalog Nest & Yard</p><h2 id="product-form-title">{editingId ? "Edytuj produkt" : "Nowy produkt"}</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Zamknij">×</button></div>
            <form className="product-form" onSubmit={saveProduct}>
              <div className="form-grid">
                <label className="field-wide">Nazwa produktu<input value={draft.name} onChange={(event) => { setField("name", event.target.value); if (!editingId) setField("slug", slugify(event.target.value)); }} placeholder="np. Fotel ogrodowy Haven" /></label>
                <label>Adres produktu<input value={draft.slug} onChange={(event) => setField("slug", slugify(event.target.value))} placeholder="fotel-ogrodowy-haven" /></label>
                <label>Kategoria<select value={draft.categorySlug} onChange={(event) => { const selected = categoryOptions.find((option) => option[1] === event.target.value); if (selected) { setField("category", selected[0]); setField("categorySlug", selected[1]); } }}>{categoryOptions.map(([name, value]) => <option key={value} value={value}>{name}</option>)}</select></label>
                <label className="field-wide">Krótki opis<textarea rows={2} value={draft.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} placeholder="Jedno zdanie widoczne na karcie produktu." /></label>
                <label className="field-wide">Pełny opis<textarea rows={5} value={draft.description} onChange={(event) => setField("description", event.target.value)} placeholder="Opis produktu na jego podstronie." /></label>
                <label>Cena<input type="number" min="0" step="1" value={draft.price ?? ""} onChange={(event) => setField("price", event.target.value === "" ? null : Number(event.target.value))} placeholder="299" /></label>
                <label>Poprzednia cena<input type="number" min="0" step="1" value={draft.oldPrice ?? ""} onChange={(event) => setField("oldPrice", event.target.value === "" ? null : Number(event.target.value))} placeholder="349" /></label>
                <label className="field-wide">Link do konkretnej oferty Allegro<input type="url" value={draft.allegroUrl} onChange={(event) => setField("allegroUrl", event.target.value)} placeholder="https://allegro.pl/oferta/..." /></label>
                <label>Numer oferty Allegro<input value={draft.allegroOfferId ?? ""} onChange={(event) => setField("allegroOfferId", event.target.value)} placeholder="np. 16001000001" /></label>
                <label>SKU produktu<input value={draft.sku ?? ""} onChange={(event) => setField("sku", event.target.value)} placeholder="NY-DON-001" /></label>
                <label>Stan magazynowy<input type="number" min="0" step="1" value={draft.stock ?? ""} onChange={(event) => setField("stock", event.target.value === "" ? null : Number(event.target.value))} placeholder="10" /></label>
                <label>Cena zakupu netto / koszt<input type="number" min="0" step="0.01" value={draft.purchasePrice ?? ""} onChange={(event) => setField("purchasePrice", event.target.value === "" ? null : Number(event.target.value))} placeholder="100" /></label>
                <label>Stawka VAT<select value={draft.vatRate ?? 23} onChange={(event) => setField("vatRate", Number(event.target.value))}><option value={23}>23%</option><option value={8}>8%</option><option value={5}>5%</option><option value={0}>0%</option></select></label>
                <label className="field-wide">Adres zdjęcia produktu — opcjonalnie<input type="url" value={draft.imageUrl} onChange={(event) => setField("imageUrl", event.target.value)} placeholder="https://.../zdjecie.jpg" /></label>
                <label>Materiał<input value={draft.material} onChange={(event) => setField("material", event.target.value)} placeholder="Aluminium, technorattan" /></label>
                <label>Wymiary<input value={draft.dimensions} onChange={(event) => setField("dimensions", event.target.value)} placeholder="82 × 78 × 74 cm" /></label>
                <label>Kolor<input value={draft.color} onChange={(event) => setField("color", event.target.value)} placeholder="Naturalny / écru" /></label>
                <label>Kolor karty<select value={draft.palette} onChange={(event) => setField("palette", event.target.value as ProductPalette)}>{paletteOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label>Oznaczenie<input value={draft.badge} onChange={(event) => setField("badge", event.target.value)} placeholder="Nowość, Bestseller, -15%" /></label>
                <div className="checkbox-group"><label><input type="checkbox" checked={draft.published} onChange={(event) => setField("published", event.target.checked)} /> Opublikowany</label><label><input type="checkbox" checked={draft.featured} onChange={(event) => setField("featured", event.target.checked)} /> Wyróżnij na stronie głównej</label></div>
              </div>
              {notice && formOpen ? <p className="form-error form-notice">{notice}</p> : null}
              <div className="form-preview"><ProductVisual product={{ name: draft.name || "Podgląd produktu", categorySlug: draft.categorySlug, imageUrl: draft.imageUrl, palette: draft.palette }} /><div><span>Podgląd</span><strong>{draft.name || "Nazwa produktu"}</strong><small>{draft.badge || "Bez oznaczenia"}</small></div></div>
              <div className="form-actions"><button className="text-button" type="button" onClick={() => setFormOpen(false)}>Anuluj</button><button className="button button-dark" type="submit">{editingId ? "Zapisz zmiany" : "Dodaj produkt"}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
