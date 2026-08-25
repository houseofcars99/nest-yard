"use client";

import { useState } from "react";

const OFFICIAL_BULK_URL = "https://edalnice.gov.cz/cs/hromadny-nakup/krok-1";

type SetData = {
  setId: string;
  registrationCountry: string;
  fuelType: string;
  validity: string;
  startDate: string;
  vehicleType: string;
  registrations: string[];
  csv: string;
};

type BatchResult = {
  batchId: string | null;
  totalItems?: number;
  sets: SetData[];
  manualRequired: Array<{ itemId: string; registrationNumber: string; reason: string }>;
  officialBulkUrl?: string;
  message?: string;
};

export default function CzechFulfilmentPage() {
  const [token, setToken] = useState("");
  const [batch, setBatch] = useState<BatchResult | null>(null);
  const [zip, setZip] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function createBatch() {
    setBusy(true); setResult("");
    try {
      const response = await fetch("/api/fulfillment/cz/batch", { method: "POST", headers: { "x-fulfilment-token": token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Nie udało się przygotować partii.");
      setBatch(data);
    } catch (error) { setResult(error instanceof Error ? error.message : "Błąd."); }
    finally { setBusy(false); }
  }

  function downloadCsv(set: SetData) {
    const blob = new Blob(["\ufeff" + set.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vignettego-cz-batch-${batch?.batchId}-set-${set.setId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function uploadZip() {
    if (!batch?.batchId || !zip) return;
    setBusy(true); setResult("");
    try {
      const form = new FormData();
      form.set("batchId", batch.batchId);
      form.set("file", zip);
      const response = await fetch("/api/fulfillment/cz/receive", { method: "POST", headers: { "x-fulfilment-token": token }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Nie udało się przetworzyć ZIP-a.");
      setResult(`ZIP przetworzony: ${data.matchedCount ?? 0}/${data.expectedCount ?? 0} dopasowanych potwierdzeń.`);
    } catch (error) { setResult(error instanceof Error ? error.message : "Błąd."); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <p style={{ letterSpacing: 2, fontSize: 12 }}>VIGNETTEGO · REALIZACJA CZ</p>
      <h1>Zakup grupowy Czechy</h1>
      <p>System wybiera wyłącznie opłacone zamówienia i grupuje je według kraju rejestracji, napędu, rodzaju winiety, daty startu i typu pojazdu. Każda grupa ma maksymalnie 200 SPZ — zgodnie z zasadami eDalnice.</p>

      <section style={{ padding: 20, border: "1px solid #ddd", borderRadius: 12, marginTop: 20 }}>
        <label>Token operatora<br /><input value={token} onChange={(e) => setToken(e.target.value)} type="password" style={{ width: "100%", maxWidth: 500, padding: 10, marginTop: 6 }} /></label>
        <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={createBatch} disabled={busy || !token} style={{ padding: "12px 18px" }}>{busy ? "Pracuję…" : "Przygotuj partię"}</button>
          <a href={OFFICIAL_BULK_URL} target="_blank" rel="noreferrer" style={{ padding: "12px 18px", border: "1px solid #999" }}>Otwórz oficjalny zakup grupowy eDalnice ↗</a>
        </div>
      </section>

      {batch && <section style={{ marginTop: 24 }}>
        <h2>Partia {batch.batchId ?? "—"}</h2>
        <p>{batch.totalItems ?? 0} pozycji przygotowanych do zakupu grupowego.</p>
        {batch.sets.map((set) => <article key={set.setId} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 18, marginTop: 14 }}>
          <strong>Zestaw {set.setId} · {set.registrations.length} SPZ</strong>
          <p>{set.registrationCountry} · {set.vehicleType} · {set.fuelType} · {set.validity} · start {set.startDate}</p>
          <button onClick={() => downloadCsv(set)} style={{ padding: "10px 14px" }}>Pobierz CSV SPZ</button>
          <details style={{ marginTop: 12 }}><summary>Podgląd SPZ</summary><pre style={{ whiteSpace: "pre-wrap" }}>{set.registrations.join("\n")}</pre></details>
        </article>)}

        {batch.manualRequired.length > 0 && <article style={{ marginTop: 18, padding: 18, border: "1px solid #d88", borderRadius: 12 }}>
          <strong>Pozycje wymagające osobnego zakupu</strong>
          <p>eDalnice nie pozwala użyć zakupu grupowego dla natychmiastowego początku ważności.</p>
          <ul>{batch.manualRequired.map((item) => <li key={item.itemId}>{item.registrationNumber}</li>)}</ul>
        </article>}

        <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>Odbierz ZIP z eDalnice</h2>
          <p>Po opłaceniu zamówienia grupowego eDalnice wysyła ZIP z osobnym potwierdzeniem dla każdego pojazdu. Wgraj go tutaj. System zapisze każdy dokument, dopasuje go do konkretnego zamówienia i przygotuje wysyłkę e-mail.</p>
          <input type="file" accept=".zip" onChange={(e) => setZip(e.target.files?.[0] ?? null)} />
          <button onClick={uploadZip} disabled={busy || !zip} style={{ marginLeft: 12, padding: "10px 14px" }}>Przetwórz ZIP</button>
        </section>
      </section>}

      {result && <p role="alert" style={{ marginTop: 20 }}>{result}</p>}
    </main>
  );
}
