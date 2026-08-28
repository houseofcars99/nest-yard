import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <p>Winiety i opłaty drogowe w Europie — prosto, szybko i w jednym miejscu.</p>
      </div>

      <div className="footer-grid">
        <div>
          <BrandLogo placement="footer" />
          <p className="muted">TOLLA pomaga załatwić europejskie opłaty drogowe przed podróżą.</p>
        </div>

        <div>
          <strong>Oferta</strong>
          <Link href="/">Winiety drogowe</Link>
          <Link href="/">Czechy</Link>
          <Link href="/">Austria</Link>
          <Link href="/">Szwajcaria</Link>
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
        <span>Europejskie opłaty drogowe</span>
      </div>
    </footer>
  );
}
