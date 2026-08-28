"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "../hero-lifestyle.css";
import { BrandLogo } from "@/components/BrandLogo";

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

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [registrationConfirmations, setRegistrationConfirmations] = useState<Record<string, string>>({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tolla-cart");
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        setItems(parsed);
        setRegistrationConfirmations(Object.fromEntries(parsed.map((item) => [item.id, ""])));
      }
    } catch {
      setItems([]);
    }
    if (new URLSearchParams(window.location.search).get("payment") === "cancelled") {
      setError("Płatność została anulowana. Twoje zamówienie nadal oczekuje na płatność.");
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
    setRegistrationConfirmations((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
    localStorage.setItem("tolla-cart", JSON.stringify(next));
  }

  function updateRegistrationConfirmation(id: string, value: string) {
    setRegistrationConfirmations((current) => ({ ...current, [id]: value }));
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const emailOk = email.trim().toLowerCase() === emailConfirmation.trim().toLowerCase() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const registrationsOk = items.every((item) => item.registrationNumber.trim().toUpperCase().replace(/[\s-]+/g, "") === (registrationConfirmations[item.id] ?? "").trim().toUpperCase().replace(/[\s-]+/g, ""));
    const datesOk = items.every((item) => item.country === "CH" || Boolean(item.startDate && item.startDate >= todayDate()));
    if (!items.length || !emailOk || !firstName || !lastName || !accepted || !registrationsOk || !datesOk) {
      setError("Sprawdź e-mail, powtórzone numery rejestracyjne, daty rozpoczęcia winiet i wymagane zgody.");
      return;
    }
    setLoading(true);
    try {
      const checkoutItems = items.map((item) => ({ ...item, registrationNumberConfirmation: registrationConfirmations[item.id] ?? "" }));
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, emailConfirmation, acceptedTerms: accepted, items: checkoutItems }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się utworzyć zamówienia.");
      setOrderNumber(data.orderNumber);

      const paymentResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: data.orderNumber }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentData.url) throw new Error(paymentData.error || "Nie udało się uruchomić płatności.");

      localStorage.removeItem("tolla-cart");
      window.location.href = paymentData.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się uruchomić płatności.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="vignette-page checkout-page">
      <nav className="topbar">
        <Link href="/" className="brand" aria-label="TOLLA — strona główna"><BrandLogo placement="header" /></Link>
        <span className="checkout-step">CHECKOUT · 01 / 02</span>
      </nav>
      <section className="checkout-layout">
        <div>
          <Link href="/" className="back-link">← Wróć do wyboru winiety</Link>
          <p className="eyebrow">DANE KLIENTA</p>
          <h1>Finalizujemy<br /><em>Twoją podróż.</em></h1>
          <form onSubmit={submitOrder} className="checkout-form">
            <div className="field-row"><label><span>Imię</span><input required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label><label><span>Nazwisko</span><input required value={lastName} onChange={(e) => setLastName(e.target.value)} /></label></div>
            <label className="full-field"><span>E-mail</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="twoj@email.pl" /></label>
            <label className="full-field"><span>Powtórz e-mail</span><input required type="email" value={emailConfirmation} onChange={(e) => setEmailConfirmation(e.target.value)} placeholder="powtórz adres e-mail" autoComplete="off" /></label>

            {items.map((item) => (
              <div key={item.id} className="full-field">
                <span>{item.flag} {item.country} · Numer rejestracyjny</span>
                <input value={item.registrationNumber} readOnly aria-label={`Numer rejestracyjny ${item.country}`} />
                <input required value={registrationConfirmations[item.id] ?? ""} onChange={(e) => updateRegistrationConfirmation(item.id, e.target.value)} placeholder="Powtórz numer rejestracyjny" autoComplete="off" />
                {item.country !== "CH" && (
                  <small>Data rozpoczęcia: {item.startDate ? new Date(item.startDate + "T00:00:00").toLocaleDateString("pl-PL") : "brak"}. Data nie może być wcześniejsza niż dzisiaj.</small>
                )}
              </div>
            ))}

            <label className="consent"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Akceptuję regulamin i politykę prywatności oraz wyrażam zgodę na realizację zamówienia na podany adres e-mail.</span></label>
            {orderNumber && !loading && <p className="price-note">Numer zamówienia: <strong>{orderNumber}</strong></p>}
            {error && <p role="alert" className="form-error">{error}</p>}
            <button className="primary-button checkout-submit" type="submit" disabled={loading}>{loading ? "Przygotowujemy bezpieczną płatność…" : "Zapłać bezpiecznie →"}</button>
            <p className="price-note">Po kliknięciu nastąpi bezpieczne przekierowanie do operatora płatności.</p>
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
