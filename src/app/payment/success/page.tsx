import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="vignette-page checkout-page">
      <nav className="topbar"><Link href="/" className="brand">VIGNETTE<span>GO</span></Link></nav>
      <section className="checkout-success">
        <span className="success-mark">✓</span>
        <p className="eyebrow">PŁATNOŚĆ PRZEKAZANA</p>
        <h1>Dziękujemy.</h1>
        <p>Otrzymaliśmy informację o płatności. Po jej potwierdzeniu zamówienie zostanie przekazane do realizacji.</p>
        <p className="price-note">Nie zamykaj strony, jeśli chcesz zachować potwierdzenie.</p>
        <Link href="/" className="primary-button link-button">Wróć do zakupów</Link>
      </section>
    </main>
  );
}
