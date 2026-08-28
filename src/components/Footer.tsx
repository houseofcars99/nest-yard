import Link from "next/link";
import { LeafIcon } from "@/components/Icons";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <LeafIcon />
        <p>Winiety i opłaty drogowe w Europie — prosto, szybko i w jednym miejscu.</p>
      </div>
      <div className="footer-grid">
        <div>
          <BrandLogo placement="footer" />
          <p className="muted">Jedno miejsce do obsługi europejskich opłat drogowych.</p>
        </div>
        <div>
          <strong>Oferta</strong>
          <Link href="/kategoria/meble-ogrodowe">Winiety</Link>
          <Link href="/kategoria/pergole-i-zadaszenia">Opłaty drogowe</Link>
          <Link href="/kategoria/donice-i-dekoracje">Road passes</Link>
          <Link href="/kategoria/dla-zwierzat">Pomoc</Link>
        </div>
        <div>
          <strong>Informacje</strong>
          <Link href="/#jak-to-dziala">Jak to działa</Link>
          <Link href="/admin">Panel administratora</Link>
          <span>Realizacja zamówień online</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 TOLLA</span>
        <span>Wersja testowa</span>
      </div>
    </footer>
  );
}
