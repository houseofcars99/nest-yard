import type { SVGProps } from "react";

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6.5 8.5h11l1 11h-13l1-11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 9V6.8A3 3 0 0 1 12 4a3 3 0 0 1 3 2.8V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LeafIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M19.5 4.5C12 4 6.5 7.4 6.5 13.2c0 3.6 2.2 5.8 5.3 5.8 5.9 0 8-7 7.7-14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 20c2.2-4.6 5.4-7.9 10-10.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PawIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 10.5c-3.7 0-6.6 3.2-6.6 6 0 2 1.5 3.1 3.2 3.1 1.3 0 2.2-.7 3.4-.7s2.1.7 3.4.7c1.7 0 3.2-1.1 3.2-3.1 0-2.8-2.9-6-6.6-6Z" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="6.8" cy="8.1" rx="2" ry="2.7" transform="rotate(-22 6.8 8.1)" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="17.2" cy="8.1" rx="2" ry="2.7" transform="rotate(22 17.2 8.1)" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="11" cy="5.7" rx="1.9" ry="2.7" transform="rotate(-6 11 5.7)" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="15" cy="5.7" rx="1.9" ry="2.7" transform="rotate(6 15 5.7)" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
