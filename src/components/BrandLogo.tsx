import type { CSSProperties } from "react";

type BrandLogoProps = { placement?: "header" | "footer" | "admin"; alt?: string };

const placementStyles: Record<NonNullable<BrandLogoProps["placement"]>, CSSProperties> = {
  header: { width: "clamp(118px, 12vw, 156px)", height: "auto", display: "block" },
  footer: { width: "132px", height: "auto", display: "block" },
  admin: { width: "118px", height: "auto", display: "block" },
};

export const BRAND_LOGO_DATA_URI = "";

export function BrandLogo({ placement = "header", alt = "TOLLA" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 520 150"
      role="img"
      aria-label={alt}
      style={placementStyles[placement]}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tollaGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f1ca58" />
          <stop offset="100%" stopColor="#dca52e" />
        </linearGradient>
        <linearGradient id="tollaTeal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#177e8d" />
          <stop offset="100%" stopColor="#0b5667" />
        </linearGradient>
      </defs>

      <g fill="url(#tollaGold)" transform="translate(174 74)">
        <circle r="38" opacity=".98" />
        <g stroke="url(#tollaGold)" strokeWidth="8" strokeLinecap="square">
          <path d="M0-67V-55" /><path d="M0 55V67" />
          <path d="M-67 0H-55" /><path d="M55 0H67" />
          <path d="M-47-47L-39-39" /><path d="M39 39L47 47" />
          <path d="M47-47L39-39" /><path d="M-39 39L-47 47" />
          <path d="M-24-63L-20-52" /><path d="M20 52L24 63" />
          <path d="M24-63L20-52" /><path d="M-20 52L-24 63" />
          <path d="M-63-24L-52-20" /><path d="M52 20L63 24" />
          <path d="M63-24L52-20" /><path d="M-52 20L-63 24" />
        </g>
      </g>

      <g fill="none" stroke="#fffdf8" strokeLinecap="round">
        <path d="M143 113C170 84 197 61 232 47C205 76 190 98 179 123" strokeWidth="8" />
        <path d="M171 119C189 92 210 70 240 53" stroke="#ffffff" strokeWidth="5" />
      </g>

      <g fill="url(#tollaTeal)" fontFamily="Arial, Helvetica, sans-serif" fontSize="108" fontWeight="800" letterSpacing="-7">
        <text x="8" y="112">T</text>
        <text x="222" y="112">L</text>
        <text x="314" y="112">L</text>
        <text x="405" y="112">A</text>
      </g>
    </svg>
  );
}
