"use client";

import Link from "next/link";
import { useState } from "react";
import { BagIcon } from "@/components/Icons";
import { BrandLogo } from "@/components/BrandLogo";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="announcement">Europejskie opłaty drogowe · winiety w jednym miejscu</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="TOLLA — strona główna">
          <BrandLogo placement="header" />
        </Link>

        <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          Menu
        </button>

        <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Główna nawigacja">
          <Link href="/" onClick={() => setOpen(false)}>Winiety</Link>
          <Link href="/#jak-to-dziala" onClick={() => setOpen(false)}>Jak to działa</Link>
        </nav>

        <Link className="tolla-chip" href="/">
          <BagIcon />
          Kup winietę
        </Link>
      </header>
    </>
  );
}
