"use client";

import { useMemo, useState } from "react";
import "./hero-lifestyle.css";
import { finalPrice, vignetteProducts, type CountryCode } from "@/data/vignettes";

type Country = { code: CountryCode; flag: string; name: string; description: string };
const countries: Country[] = [
  { code: "CZ", flag: "🇨🇿", name: "Czechy", description: "Elektroniczna winieta" },
  { code: "AT", flag: "🇦🇹", name: "Austria", description: "Cyfrowa winieta" },
  { code: "CH", flag: "🇨🇭", name: "Szwajcaria", description: "E-winieta" },
];

const registrationCountries = ["PL", "DE", "CZ", "AT", "SK", "HU", "IT"];

function money(value: number, currency: string) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

export default function HomePage() {
  const [country, setCountry] = useState<CountryCode>("CZ");
  const [vehicle, setVehicle] = useState<"car" | "motorcycle">("car");
  const [registrationCountry, setRegistrationCountry] = useState("PL");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fuel, setFuel] = useState("diesel");
  const [startDate, setStartDate] = useState("");
  const [validity, setValidity] = useState("10 dni");
  const [cartCount, setCartCount] = useState(0);

  const selectedCountry = countries.find((item) => item.code === country)!;
  const availableProducts = useMemo(() => vignetteProducts.filter((p) => p.country === country && p.vehicleType === vehicle), [country, vehicle]);
  const product = availableProducts.find((p) => p.validity === validity) ?? availableProducts[0];
  const price = product ? finalPrice(product) : 0;
  const showFuel = country === "CZ";
  const showStartDate = country !== "CH";

  function changeCountry(next: CountryCode) {
    setCountry(next);
    setVehicle("car");
    setValidity(next === "CH" ? "roczna" : "10 dni");
  }

  function addToCart() {
    if (!registrationNumber.trim() || (showStartDate && !startDate)) return;
    setCartCount((count) => count + 1);
  }

  return (
    <main className="vignette-page">
      <nav className="topbar"><div className="brand">VIGNETTE<span>GO</span></div><button className="cart-button" type="button">Koszyk <strong>{cartCount}</strong></button></nav>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">EUROPEAN ROAD FEES</p><h1>Jedź dalej.<br /><em>My zajmiemy się winietą.</em></h1><p className="hero-text">Kup elektroniczną winietę na podróż po Europie. Prosto, szybko i bez zbędnych kroków.</p></div>
        <div className="purchase-card">
          <div className="country-heading"><div><span className="label">KRAJ</span><h2>{selectedCountry.flag} {selectedCountry.name}</h2></div><span className="product-type">{selectedCountry.description}</span></div>
          <div className="country-grid">{countries.map((item) => <button key={item.code} type="button" className={country === item.code ? "country active" : "country"} onClick={() => changeCountry(item.code)}><span>{item.flag}</span><b>{item.name}</b></button>)}</div>
          <div className="field-row">
            <label><span>Typ pojazdu</span><select value={vehicle} onChange={(e) => setVehicle(e.target.value as "car" | "motorcycle")}><option value="car">Samochód</option><option value="motorcycle">Motocykl</option></select></label>
            <label><span>Kraj rejestracji</span><select value={registrationCountry} onChange={(e) => setRegistrationCountry(e.target.value)}>{registrationCountries.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
          </div>
          <label className="full-field"><span>Numer rejestracyjny</span><input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())} placeholder="np. DW 12345" /></label>
          {showFuel && <label className="full-field"><span>Rodzaj napędu</span><select value={fuel} onChange={(e) => setFuel(e.target.value)}><option value="diesel">Diesel</option><option value="petrol">Benzyna</option><option value="electric">Elektryczny / wodór</option><option value="biomethane">Biometan</option><option value="cng">CNG / LNG</option><option value="plug-in">Plug-in hybrid</option></select></label>}
          <label className="full-field"><span>Okres ważności</span><select value={product?.validity ?? validity} onChange={(e) => setValidity(e.target.value)}>{availableProducts.map((item) => <option key={item.id} value={item.validity}>{item.validity}</option>)}</select></label>
          {showStartDate && <label className="full-field"><span>Data rozpoczęcia</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>}
          <div className="price-line"><div><span>Cena końcowa</span><strong>{product ? money(price, product.currency) : "—"}</strong></div><button className="primary-button" type="button" onClick={addToCart}>Dodaj do koszyka →</button></div>
          <p className="price-note">Cena końcowa zawiera wszystkie opłaty za realizację zamówienia.</p>
        </div>
      </section>
      <section className="benefits"><div><b>01</b><h3>Jedna strona</h3><p>Wybierz kraj i uzupełnij tylko dane wymagane do rejestracji.</p></div><div><b>02</b><h3>Jedna płatność</h3><p>Możesz dodać winiety z kilku krajów do jednego koszyka.</p></div><div><b>03</b><h3>Cyfrowe potwierdzenie</h3><p>Po realizacji otrzymasz potwierdzenie na swój adres e-mail.</p></div></section>
    </main>
  );
}
