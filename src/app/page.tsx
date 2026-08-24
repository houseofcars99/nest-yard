"use client";

import { useState } from "react";
import "./hero-lifestyle.css";

type Country = { code: string; flag: string; name: string; description: string };
const countries: Country[] = [
  { code: "CZ", flag: "🇨🇿", name: "Czechy", description: "Elektroniczna winieta" },
  { code: "AT", flag: "🇦🇹", name: "Austria", description: "Cyfrowa winieta" },
  { code: "CH", flag: "🇨🇭", name: "Szwajcaria", description: "E-winieta" },
];
const products = {
  CZ: { label: "10 dni", price: 12, currency: "EUR" },
  AT: { label: "10 dni", price: 12.8, currency: "EUR" },
  CH: { label: "roczna", price: 40, currency: "CHF" },
} as const;
const finalPrice = (price: number) => price * 1.15;
function money(value: number, currency: string) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

export default function HomePage() {
  const [country, setCountry] = useState("CZ");
  const [vehicle, setVehicle] = useState("car");
  const [registrationCountry, setRegistrationCountry] = useState("PL");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fuel, setFuel] = useState("diesel");
  const [startDate, setStartDate] = useState("");
  const selectedCountry = countries.find((item) => item.code === country)!;
  const product = products[country as keyof typeof products];
  const price = finalPrice(product.price);
  const showFuel = country === "CZ";
  const showStartDate = country !== "CH";

  return (
    <main className="vignette-page">
      <nav className="topbar"><div className="brand">VIGNETTE<span>GO</span></div><button className="cart-button" type="button">Koszyk <strong>0</strong></button></nav>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">EUROPEAN ROAD FEES</p><h1>Jedź dalej.<br /><em>My zajmiemy się winietą.</em></h1><p className="hero-text">Kup elektroniczną winietę na podróż po Europie. Prosto, szybko i bez zbędnych kroków.</p></div>
        <div className="purchase-card">
          <div className="country-heading"><div><span className="label">KRAJ</span><h2>{selectedCountry.flag} {selectedCountry.name}</h2></div><span className="product-type">{selectedCountry.description}</span></div>
          <div className="country-grid">{countries.map((item) => <button key={item.code} type="button" className={country === item.code ? "country active" : "country"} onClick={() => setCountry(item.code)}><span>{item.flag}</span><b>{item.name}</b></button>)}</div>
          <div className="field-row">
            <label><span>Typ pojazdu</span><select value={vehicle} onChange={(e) => setVehicle(e.target.value)}><option value="car">Samochód</option><option value="motorcycle">Motocykl</option></select></label>
            <label><span>Kraj rejestracji</span><select value={registrationCountry} onChange={(e) => setRegistrationCountry(e.target.value)}><option value="PL">🇵🇱 Polska</option><option value="DE">🇩🇪 Niemcy</option><option value="CZ">🇨🇿 Czechy</option><option value="AT">🇦🇹 Austria</option></select></label>
          </div>
          <label className="full-field"><span>Numer rejestracyjny</span><input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())} placeholder="np. DW 12345" /></label>
          {showFuel && <label className="full-field"><span>Rodzaj napędu</span><select value={fuel} onChange={(e) => setFuel(e.target.value)}><option value="diesel">Diesel</option><option value="petrol">Benzyna</option><option value="electric">Elektryczny</option><option value="cng">CNG / LNG / biometan</option></select></label>}
          {showStartDate && <label className="full-field"><span>Data rozpoczęcia</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>}
          <div className="price-line"><div><span>{product.label}</span><strong>{money(price, product.currency)}</strong></div><button className="primary-button" type="button">Dodaj do koszyka →</button></div>
          <p className="price-note">Cena końcowa. Bez dodatkowych opłat na kolejnym etapie.</p>
        </div>
      </section>
      <section className="benefits"><div><b>01</b><h3>Jedna strona</h3><p>Wybierz kraj i uzupełnij tylko dane wymagane do rejestracji.</p></div><div><b>02</b><h3>Jedna płatność</h3><p>Możesz dodać winiety z kilku krajów do jednego koszyka.</p></div><div><b>03</b><h3>Cyfrowe potwierdzenie</h3><p>Po realizacji otrzymasz potwierdzenie na swój adres e-mail.</p></div></section>
    </main>
  );
}
