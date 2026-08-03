"use client";

import { useEffect } from "react";
import { BRAND_LOGO_DATA_URI } from "@/components/BrandLogo";

export function AdminBrandLogo() {
  useEffect(() => {
    function applyLogo() {
      document.querySelectorAll<HTMLAnchorElement>(".admin-brand").forEach((brand) => {
        if (brand.dataset.logoApplied === "true") return;

        brand.replaceChildren();
        brand.dataset.logoApplied = "true";
        brand.setAttribute("aria-label", "Nest & Yard — strona główna");
        brand.style.display = "inline-flex";
        brand.style.alignItems = "center";
        brand.style.justifyContent = "center";
        brand.style.width = "fit-content";
        brand.style.padding = "6px 10px";
        brand.style.borderRadius = "16px";
        brand.style.background = "#fffaf1";

        const image = document.createElement("img");
        image.src = BRAND_LOGO_DATA_URI;
        image.alt = "Nest & Yard";
        image.width = 150;
        image.height = 99;
        image.style.display = "block";
        image.style.width = "160px";
        image.style.maxWidth = "100%";
        image.style.height = "auto";
        image.style.objectFit = "contain";
        brand.appendChild(image);
      });
    }

    applyLogo();
    const observer = new MutationObserver(applyLogo);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
