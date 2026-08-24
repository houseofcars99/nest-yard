"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "../hero-lifestyle.css";

type CartItem = {
  id: string;
  country: string;
  flag: string;
  product: string;
  validity: string;
  registrationNumber: string;
  registrationCountry: string;
  fuelType?: string;
  startDate?: string;
  price: number;
  currency: string;
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency }).format(value);
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vignettego-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {
      setItems([]);
    }
  }, []);

  const totals = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of items) grouped.set(item.currency, (grouped.get(item.currency) ?? 0) + item.price);
    return [...grouped.entries()];
  }, [items]);

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    localStorage.setItem("vignettego-cart", JSON.stringify(next));
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!items.length || !email || !firstName || !lastName || !accepted) return;
    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, acceptedTerms: accepted, items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się utworzyć zamówienia.");
      setOrderNumber(data.orderNumber);
      setSubmitted(true);
      localStorage.removeItem("vignettego-cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć zamówienia.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="vignette-page checkout-page">
        <nav className="topbar"><Link href="/" className="brand">VIGNETTE<span>GO</span></Link></nav>
        <section className="checkout-success">
          <span className="success-mark">✓</span>
          <p className="eyebrow">ZAMÓWIENIE UTWORZONE</p>
          <h1>Jesteśmy gotowi.</h1>
          <p>Numer zamówienia: <strong>{orderNumber}</strong></p>
          <p>Twoje zamówienie zostało zapisane. Następnym krokiem będzie bezpieczna płatność, a następnie automatyczna realizacja winiety.</p>
          <Link href="/" className="primary-button link-button">Wróć do zakupów</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="vignette-page checkout-page">
      <nav className="topbar"><Link href="/" className="brand">VIGNETTE<span>GO</span></Link><span className="checkout-step">CHECKOUT · 01 / 02</span></nav>
      <section className="checkout-layout">
        <div>
          <Link href="/" className="back-link">← Wróć do wyboru winiety</Link>
          <p className="eyebrow">DANE KLIENTA</p>
          <h1>Finalizujemy<br /><em>Twoją podróż.</em></h1>
          <form onSubmit={submitOrder} className="checkout-form">
            <div className="field-row"><label><span>Imię</span><input required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label><label><span>Nazwisko</span><input required value={lastName} onChange={(e) => setLastName(e.target.value)} /></label></div>
            <label className="full-field"><span>E-mail</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="twoj@email.pl" /></label>
            <label className="consent"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Akceptuję regulamin i politykę prywatności oraz wyrażam zgodę na realizację zamówienia na podany adres e-mail.</span></label>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button className="primary-button checkout-submit" type="submit" disabled={loading}>{loading ? "Tworzymy zamówienie…" : "Przejdź do płatności →"}</button>
            <p className="price-note">Na tym etapie nie pobieramy jeszcze płatności.</p>
          </form>
        </div>
        <aside className="order-summary">
          <p className="eyebrow">TWOJE WINIETY</p>
          {!items.length ? <><h2>Koszyk jest pusty.</h2><Link href="/" className="primary-button link-button">Wybierz winietę</Link></> : <>
            {items.map((item) => <div className="summary-item" key={item.id}><div><strong>{item.flag} {item.country}</strong><span>{item.product} · {item.validity}</span><span>{item.registrationCountry} · {item.registrationNumber}</span></div><div><strong>{money(item.price, item.currency)}</strong><button type="button" onClick={() => remove(item.id)} aria-label="Usuń">×</button></div></div>)}
            <div className="summary-total"><span>Razem</span><div>{totals.map(([currency, total]) => <strong key={currency}>{money(total, currency)}</strong>)}</div></div>
          </>}
        </aside>
      </section>
    </main>
  );
}
