import type { CSSProperties } from "react";

type BrandLogoProps = { placement?: "header" | "footer" | "admin"; alt?: string };
const placementStyles: Record<NonNullable<BrandLogoProps["placement"]>, CSSProperties> = {
  header:{fontSize:"clamp(28px,3vw,38px)",fontWeight:800,letterSpacing:"-.06em",display:"inline-block"},
  footer:{fontSize:"32px",fontWeight:800,letterSpacing:"-.06em",display:"inline-block"},
  admin:{fontSize:"28px",fontWeight:800,letterSpacing:"-.06em",display:"inline-block"}
};
export const BRAND_LOGO_DATA_URI = "";
export function BrandLogo({placement="header",alt="TOLLA"}:BrandLogoProps){return <span aria-label={alt} style={placementStyles[placement]}>TOLLA</span>;}
