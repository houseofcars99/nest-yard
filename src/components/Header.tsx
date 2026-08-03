"use client";

import Link from "next/link";
import { useState } from "react";
import { BagIcon } from "@/components/Icons";
import { BrandLogo } from "@/components/BrandLogo";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="announcement">Wybrane rzeczy do domu i ogrodu · bezpieczny zakup na Allegro</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Nest & Yard — strona główna">
          <BrandLogo placement="header" />
        </Link>
        <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          Menu
        </button>
        <nav className={open ? "main-nav is-open" : "main-nav"}>
          <Link href="/kategoria/meble-ogrodowe" onClick={() => setOpen(false)}>Meble</Link>
          <Link href="/kategoria/pergole-i-zadaszenia" onClick={() => setOpen(false)}>Pergole</Link>
          <Link href="/kategoria/donice-i-dekoracje" onClick={() => setOpen(false)}>Donice</Link>
          <Link href="/kategoria/dla-zwierzat" onClick={() => setOpen(false)}>Dla zwierząt</Link>
          <Link href="/#kolekcje" onClick={() => setOpen(false)}>Wszystko</Link>
        </nav>
        <Link className="allegro-chip" href="/#produkty">
          <BagIcon />
          Kup na Allegro
        </Link>
      </header>
    </>
  );
}
