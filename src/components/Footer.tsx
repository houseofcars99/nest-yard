import Link from "next/link";
import { LeafIcon } from "@/components/Icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <LeafIcon />
        <p>Rzeczy, które dobrze wyglądają i dobrze służą — w domu, ogrodzie i codziennym życiu ze zwierzętami.</p>
      </div>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">Nest <em>&</em> Yard</div>
          <p className="muted">Katalog inspiracji z bezpośrednimi linkami do aktualnych ofert Allegro.</p>
        </div>
        <div>
          <strong>Kolekcje</strong>
          <Link href="/kategoria/meble-ogrodowe">Meble ogrodowe</Link>
          <Link href="/kategoria/pergole-i-zadaszenia">Pergole</Link>
          <Link href="/kategoria/donice-i-dekoracje">Donice i dekoracje</Link>
          <Link href="/kategoria/dla-zwierzat">Dla zwierząt</Link>
        </div>
        <div>
          <strong>Informacje</strong>
          <Link href="/#jak-to-dziala">Jak kupować</Link>
          <Link href="/admin">Panel administratora</Link>
          <span>Sprzedaż realizowana na Allegro</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Nest & Yard</span>
        <span>Testowa wersja katalogu</span>
      </div>
    </footer>
  );
}
