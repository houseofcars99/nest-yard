"use client";

import { useEffect, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";

const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1400;
const WEBP_QUALITY = 0.78;

const INVOICE_PRINT_STYLES = `
@page { size: A4 portrait; margin: 12mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #1d2e29; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.invoice-document { width: 100%; margin: 0; padding: 0; background: #fff; color: #1d2e29; box-shadow: none; }
.invoice-document header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
.invoice-document header > div { display: flex; flex-direction: column; gap: 4px; }
.invoice-document header > div:last-child { text-align: right; align-items: flex-end; }
.invoice-logo { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #d88f70; color: #fff; font-weight: 700; }
.invoice-document h1 { margin: 2px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 20pt; line-height: 1.15; letter-spacing: 0; }
.invoice-document header p { margin: 0; font-size: 9pt; letter-spacing: .08em; }
.invoice-document small { font-size: 8.5pt; }
.invoice-status-badge { display: inline-block; border-radius: 999px; padding: 5px 8px; background: #e6ece8; font-size: 7.5pt; font-weight: 700; }
.status-ksef_pending { background: #f6dfd2; color: #9c4c36; }
.status-issued, .status-paid, .status-ksef_sent { background: #d9ebdf; color: #256043; }
.invoice-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 24px 0; break-inside: avoid; }
.invoice-parties > div { border: 1px solid #d8dedb; border-radius: 8px; padding: 12px; }
.invoice-parties span, .invoice-dates span { color: #68766f; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .04em; }
.invoice-parties strong { display: block; margin-top: 5px; }
.invoice-parties p { margin: 6px 0 0; line-height: 1.45; font-size: 8.5pt; }
.invoice-dates { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; break-inside: avoid; }
.invoice-dates div { display: flex; flex-direction: column; gap: 4px; }
.invoice-document table { width: 100%; border-collapse: collapse; font-size: 8.5pt; table-layout: fixed; }
.invoice-document thead { display: table-header-group; }
.invoice-document tr { break-inside: avoid; }
.invoice-document th, .invoice-document td { padding: 8px 7px; border-bottom: 1px solid #d8dedb; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
.invoice-document th:first-child, .invoice-document td:first-child { width: 7%; }
.invoice-document th:nth-child(2), .invoice-document td:nth-child(2) { width: 39%; }
.invoice-document th:nth-child(3), .invoice-document td:nth-child(3) { width: 14%; }
.invoice-document th:nth-child(4), .invoice-document td:nth-child(4) { width: 17%; }
.invoice-document th:nth-child(5), .invoice-document td:nth-child(5) { width: 8%; }
.invoice-document th:nth-child(6), .invoice-document td:nth-child(6) { width: 15%; text-align: right; }
.invoice-summary { display: grid; grid-template-columns: 1fr 260px; gap: 28px; margin-top: 20px; break-inside: avoid; }
.invoice-summary > div:last-child p { display: flex; justify-content: space-between; gap: 18px; margin: 8px 0; }
.invoice-summary p { margin-top: 0; line-height: 1.45; }
.invoice-total { font-size: 12pt; border-top: 2px solid #1d2e29; padding-top: 9px; }
.invoice-document footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #d8dedb; font-size: 7.5pt; color: #68766f; }
@media print {
  html, body { width: 210mm; }
  .invoice-document { break-after: avoid; }
}
`;

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nie udało się otworzyć obrazu."));
    image.src = source;
  });
}

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Wybierz plik graficzny JPG, PNG, WEBP lub HEIC obsługiwany przez przeglądarkę.");
  }
  if (file.size > MAX_SOURCE_FILE_SIZE) {
    throw new Error("Plik jest za duży. Maksymalny rozmiar zdjęcia to 10 MB.");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const ratio = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Przeglądarka nie może przygotować podglądu zdjęcia.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/webp", WEBP_QUALITY);
}

function updateReactInput(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function printCurrentInvoice() {
  const invoice = document.querySelector<HTMLElement>(".invoice-modal .invoice-document");
  if (!invoice) return;

  const frame = document.createElement("iframe");
  frame.setAttribute("title", "Wydruk faktury");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.border = "0";
  frame.style.opacity = "0";
  document.body.appendChild(frame);

  const printDocument = frame.contentDocument;
  if (!printDocument) {
    frame.remove();
    return;
  }

  const number = invoice.querySelector("h1")?.textContent?.trim() || "Faktura";
  printDocument.open();
  printDocument.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${number.replace(/[<>]/g, "")}</title><style>${INVOICE_PRINT_STYLES}</style></head><body>${invoice.outerHTML}</body></html>`);
  printDocument.close();

  const cleanup = () => {
    window.setTimeout(() => frame.remove(), 300);
  };

  window.setTimeout(() => {
    const printWindow = frame.contentWindow;
    if (!printWindow) {
      cleanup();
      return;
    }
    printWindow.onafterprint = cleanup;
    printWindow.focus();
    printWindow.print();
    window.setTimeout(cleanup, 60_000);
  }, 250);
}

function ImageDropzone({ sourceInput }: { sourceInput: HTMLInputElement }) {
  const [preview, setPreview] = useState(sourceInput.value);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function useFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const optimized = await optimizeImage(file);
      updateReactInput(sourceInput, optimized);
      setPreview(optimized);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nie udało się dodać zdjęcia.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void useFile(event.dataTransfer.files?.[0]);
  }

  function removeImage() {
    updateReactInput(sourceInput, "");
    setPreview("");
    setError("");
  }

  return (
    <div className="product-image-uploader">
      <div
        className={`product-image-dropzone${dragging ? " is-dragging" : ""}${preview ? " has-image" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={onDrop}
      >
        {preview ? <img src={preview} alt="Podgląd zdjęcia produktu" /> : <div className="product-image-placeholder"><strong>Przeciągnij zdjęcie tutaj</strong><span>albo wybierz plik z urządzenia</span><small>JPG, PNG lub WEBP · maks. 10 MB</small></div>}
        <label className="button button-outline product-image-select">
          {busy ? "Przygotowuję zdjęcie…" : preview ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={busy} onChange={(event) => { void useFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
      </div>
      <div className="product-image-meta">
        <span>Zdjęcie jest automatycznie zmniejszane i zapisywane w wersji demonstracyjnej w tej przeglądarce.</span>
        {preview ? <button type="button" className="text-button danger" onClick={removeImage}>Usuń zdjęcie</button> : null}
      </div>
      {error ? <p className="form-error product-image-error">{error}</p> : null}
    </div>
  );
}

export function AdminEnhancements() {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [sourceInput, setSourceInput] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    function scanForImageField() {
      const labels = Array.from(document.querySelectorAll<HTMLLabelElement>(".product-form label"));
      const label = document.querySelector<HTMLLabelElement>(".product-image-upload-field")
        ?? labels.find((candidate) => candidate.textContent?.includes("Adres zdjęcia produktu"));
      const input = label?.querySelector<HTMLInputElement>('input[type="url"]');

      if (!label || !input) {
        setPortalHost(null);
        setSourceInput(null);
        return;
      }

      label.classList.add("product-image-upload-field");
      const titleNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes("Adres zdjęcia produktu"));
      if (titleNode) titleNode.textContent = "Zdjęcie produktu — opcjonalnie";
      input.classList.add("legacy-image-url-input");
      let host = label.querySelector<HTMLElement>(".product-image-upload-host");
      if (!host) {
        host = document.createElement("div");
        host.className = "product-image-upload-host";
        label.appendChild(host);
      }
      setPortalHost(host);
      setSourceInput(input);
    }

    scanForImageField();
    const observer = new MutationObserver(scanForImageField);
    observer.observe(document.body, { childList: true, subtree: true });

    function interceptPrint(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (!target?.textContent?.includes("Drukuj / zapisz PDF")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      printCurrentInvoice();
    }

    document.addEventListener("click", interceptPrint, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", interceptPrint, true);
    };
  }, []);

  return portalHost && sourceInput ? createPortal(<ImageDropzone sourceInput={sourceInput} />, portalHost) : null;
}
