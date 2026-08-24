"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("VignetteGO global client error", error);
  }, [error]);

  return (
    <html lang="pl">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32, background: "#f7f3ec", color: "#17201d" }}>
        <main style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1>VignetteGO — błąd aplikacji</h1>
          <p>Wystąpił błąd po stronie przeglądarki. Poniższa informacja pomoże nam go usunąć.</p>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 20, background: "white", borderRadius: 12 }}>
            {error?.message || "Nieznany błąd klienta"}
            {error?.digest ? `\n\nDigest: ${error.digest}` : ""}
          </pre>
          <button onClick={() => reset()} style={{ padding: "12px 18px", borderRadius: 10, border: 0, cursor: "pointer" }}>
            Spróbuj ponownie
          </button>
        </main>
      </body>
    </html>
  );
}
