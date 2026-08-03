"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { demoInvoices, demoOrders, demoSettings } from "@/data/demo-commerce";
import type { AllegroOrder, Invoice, InvoiceStatus, OrderStatus, StoreSettings } from "@/lib/commerce-types";
import type { Product } from "@/lib/types";

const ORDERS_KEY = "nest-and-yard-orders-v1";
const INVOICES_KEY = "nest-and-yard-invoices-v1";
const SETTINGS_KEY = "nest-and-yard-settings-v1";

type Tab = "dashboard" | "orders" | "invoices" | "allegro" | "tools";
type ApiStatus = { configured: boolean; connected: boolean; environment: "production" | "sandbox"; missing: string[] };

const orderLabels: Record<OrderStatus, string> = {
  NEW: "Nowe",
  PROCESSING: "W realizacji",
  READY_FOR_SHIPMENT: "Do wysyłki",
  SENT: "Wysłane",
  COMPLETED: "Zakończone",
  CANCELLED: "Anulowane",
  RETURNED: "Zwrócone",
};

const invoiceLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Szkic",
  ISSUED: "Wystawiona",
  KSEF_PENDING: "Oczekuje na KSeF",
  KSEF_SENT: "Wysłana do KSeF",
  PAID: "Opłacona",
  CANCELLED: "Anulowana",
};

function money(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(value);
}

function date(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function download(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function nextInvoiceNumber(prefix: string, count: number) {
  const now = new Date();
  return `${prefix}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}/${String(count + 1).padStart(3, "0")}`;
}

function invoiceFromOrder(order: AllegroOrder, settings: StoreSettings, count: number): Invoice {
  const currentDate = new Date().toISOString().slice(0, 10);
  return {
    id: `inv-${Date.now()}`,
    number: nextInvoiceNumber(settings.invoicePrefix, count),
    orderId: order.id,
    allegroOrderId: order.allegroOrderId,
    issueDate: currentDate,
    saleDate: order.createdAt.slice(0, 10),
    dueDate: currentDate,
    paymentMethod: order.paymentStatus === "PAID" ? "Allegro — opłacono" : "Płatność przez Allegro",
    sellerName: settings.sellerName,
    sellerTaxId: settings.sellerTaxId,
    sellerAddress: settings.sellerAddress,
    sellerBankAccount: settings.sellerBankAccount,
    buyerName: order.buyerName,
    buyerTaxId: order.buyerTaxId,
    buyerAddress: order.deliveryAddress,
    buyerEmail: order.buyerEmail,
    notes: `Zamówienie Allegro: ${order.allegroOrderId}`,
    status: order.buyerTaxId ? "KSEF_PENDING" : "ISSUED",
    ksefNumber: "",
    lines: order.lineItems.map((line) => ({
      id: `ifl-${line.id}`,
      name: line.name,
      quantity: line.quantity,
      unit: "szt.",
      unitGross: line.unitPrice,
      vatRate: line.vatRate,
    })),
  };
}

function totals(invoice: Invoice) {
  return invoice.lines.reduce(
    (sum, line) => {
      const gross = line.quantity * line.unitGross;
      const net = line.vatRate ? gross / (1 + line.vatRate / 100) : gross;
      return { net: sum.net + net, vat: sum.vat + gross - net, gross: sum.gross + gross };
    },
    { net: 0, vat: 0, gross: 0 },
  );
}

export function AdminOperations({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<AllegroOrder[]>(demoOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);
  const [settings, setSettings] = useState<StoreSettings>(demoSettings);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [api, setApi] = useState<ApiStatus>({ configured: false, connected: false, environment: "production", missing: [] });
  const [manual, setManual] = useState({ buyerName: "", buyerTaxId: "", buyerAddress: "", buyerEmail: "", name: "", quantity: 1, price: 0, vat: 23 });
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    setOrders(read(ORDERS_KEY, demoOrders));
    setInvoices(read(INVOICES_KEY, demoInvoices));
    setSettings(read(SETTINGS_KEY, demoSettings));
    void fetch("/api/allegro/status").then((response) => response.json()).then(setApi).catch(() => undefined);
  }, []);

  const validOrders = useMemo(
    () => orders.filter((order) => !["CANCELLED", "RETURNED"].includes(order.status) && order.paymentStatus !== "REFUNDED"),
    [orders],
  );

  const metrics = useMemo(() => {
    const revenue = validOrders.reduce((sum, order) => sum + order.paidAmount, 0);
    const fees = validOrders.reduce((sum, order) => sum + Math.abs(order.allegroFees), 0);
    const costs = validOrders.reduce((sum, order) => sum + order.lineItems.reduce((subtotal, line) => {
      const product = products.find((item) => item.id === line.productId);
      return subtotal + (product?.purchasePrice ?? 0) * line.quantity;
    }, 0), 0);
    return {
      revenue,
      fees,
      margin: revenue - fees - costs,
      average: validOrders.length ? revenue / validOrders.length : 0,
      pending: orders.filter((order) => ["NEW", "PROCESSING", "READY_FOR_SHIPMENT"].includes(order.status)).length,
    };
  }, [orders, products, validOrders]);

  const bestSellers = useMemo(() => {
    const result = new Map<string, { id: string; name: string; sku: string; quantity: number; revenue: number; clicks: number; stock: number | null }>();
    validOrders.forEach((order) => order.lineItems.forEach((line) => {
      const product = products.find((item) => item.id === line.productId);
      const current = result.get(line.productId) ?? { id: line.productId, name: line.name, sku: line.sku, quantity: 0, revenue: 0, clicks: product?.clicks ?? 0, stock: product?.stock ?? null };
      current.quantity += line.quantity;
      current.revenue += line.quantity * line.unitPrice;
      result.set(line.productId, current);
    }));
    return [...result.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  }, [products, validOrders]);

  const filteredOrders = orders.filter((order) => `${order.buyerName} ${order.allegroOrderId} ${order.lineItems.map((line) => line.name).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const lowStock = products.filter((product) => product.stock !== null && product.stock !== undefined && product.stock <= settings.lowStockThreshold);

  function persistOrders(next: AllegroOrder[]) { setOrders(next); save(ORDERS_KEY, next); }
  function persistInvoices(next: Invoice[]) { setInvoices(next); save(INVOICES_KEY, next); }
  function persistSettings(next: StoreSettings) { setSettings(next); save(SETTINGS_KEY, next); }

  function addInvoice(order: AllegroOrder) {
    if (order.invoiceId || invoices.some((invoice) => invoice.orderId === order.id)) {
      setNotice("To zamówienie ma już fakturę.");
      return;
    }
    const invoice = invoiceFromOrder(order, settings, invoices.length);
    persistInvoices([invoice, ...invoices]);
    persistOrders(orders.map((item) => item.id === order.id ? { ...item, invoiceId: invoice.id } : item));
    setSelectedInvoice(invoice);
  }

  function updateOrder(id: string, status: OrderStatus) {
    persistOrders(orders.map((order) => order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order));
  }

  function updateInvoice(id: string, status: InvoiceStatus) {
    const next = invoices.map((invoice) => invoice.id === id ? { ...invoice, status } : invoice);
    persistInvoices(next);
    setSelectedInvoice(next.find((invoice) => invoice.id === id) ?? null);
  }

  async function syncAllegro() {
    setSyncing(true);
    setNotice("");
    try {
      const response = await fetch("/api/allegro/snapshot");
      const result = await response.json() as { orders?: AllegroOrder[]; error?: string };
      if (!response.ok || !result.orders) throw new Error(result.error || "Nie udało się pobrać danych.");
      persistOrders(result.orders);
      setNotice(`Pobrano ${result.orders.length} zamówień z Allegro.`);
      setApi((current) => ({ ...current, connected: true }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Błąd synchronizacji Allegro.");
    } finally {
      setSyncing(false);
    }
  }

  function createManual(event: FormEvent) {
    event.preventDefault();
    if (!manual.buyerName || !manual.name || manual.price <= 0) return;
    const currentDate = new Date().toISOString().slice(0, 10);
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: nextInvoiceNumber(settings.invoicePrefix, invoices.length),
      orderId: null,
      allegroOrderId: null,
      issueDate: currentDate,
      saleDate: currentDate,
      dueDate: currentDate,
      paymentMethod: "Przelew",
      sellerName: settings.sellerName,
      sellerTaxId: settings.sellerTaxId,
      sellerAddress: settings.sellerAddress,
      sellerBankAccount: settings.sellerBankAccount,
      buyerName: manual.buyerName,
      buyerTaxId: manual.buyerTaxId,
      buyerAddress: manual.buyerAddress,
      buyerEmail: manual.buyerEmail,
      notes: "Faktura wystawiona ręcznie w Nest & Yard.",
      status: manual.buyerTaxId ? "KSEF_PENDING" : "ISSUED",
      ksefNumber: "",
      lines: [{ id: `line-${Date.now()}`, name: manual.name, quantity: manual.quantity, unit: "szt.", unitGross: manual.price, vatRate: manual.vat }],
    };
    persistInvoices([invoice, ...invoices]);
    setManualOpen(false);
    setSelectedInvoice(invoice);
  }

  return (
    <section className="commerce-panel" id="operations">
      <div className="commerce-panel-head">
        <div><p className="eyebrow">Centrum operacyjne</p><h2>Sprzedaż, faktury i Allegro</h2><p>Statystyki liczone z pozycji opłaconych zamówień, nie tylko z kliknięć.</p></div>
        <span className={api.connected ? "connection connected" : "connection"}>{api.connected ? "Allegro połączone" : "Tryb demonstracyjny"}</span>
      </div>
      <nav className="commerce-tabs">
        {(["dashboard", "orders", "invoices", "allegro", "tools"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{({ dashboard: "Pulpit", orders: "Zamówienia", invoices: "Faktury", allegro: "Allegro", tools: "Narzędzia" } as Record<Tab, string>)[item]}</button>)}
      </nav>
      {notice ? <div className="admin-notice">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

      {tab === "dashboard" ? <>
        <div className="commerce-kpis">
          <article><span>Sprzedaż brutto</span><strong>{money(metrics.revenue)}</strong><small>{validOrders.length} opłaconych zamówień</small></article>
          <article><span>Opłaty Allegro</span><strong>{money(metrics.fees)}</strong><small>pobrane z billing entries</small></article>
          <article><span>Marża szacunkowa</span><strong>{money(metrics.margin)}</strong><small>po kosztach zakupu i opłatach</small></article>
          <article><span>Średnie zamówienie</span><strong>{money(metrics.average)}</strong><small>{metrics.pending} zamówień do obsługi</small></article>
        </div>
        <article className="commerce-card">
          <div className="commerce-card-heading"><div><h3>Najlepiej sprzedające się produkty</h3><p>Ranking według liczby sprzedanych sztuk w opłaconych, niezwróconych zamówieniach.</p></div></div>
          <div className="commerce-table-wrap"><table className="commerce-table"><thead><tr><th>#</th><th>Produkt</th><th>SKU</th><th>Sprzedane</th><th>Przychód</th><th>Stan</th><th>Kliknięcia</th></tr></thead><tbody>{bestSellers.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.name}</strong></td><td>{item.sku || "—"}</td><td>{item.quantity} szt.</td><td>{money(item.revenue)}</td><td><span className={item.stock !== null && item.stock <= settings.lowStockThreshold ? "stock-pill low" : "stock-pill"}>{item.stock ?? "—"}</span></td><td>{item.clicks}</td></tr>)}</tbody></table></div>
        </article>
      </> : null}

      {tab === "orders" ? <article className="commerce-card">
        <div className="commerce-card-heading"><div><h3>Zamówienia Allegro</h3><p>Wyszukiwanie, status realizacji oraz wystawianie faktur.</p></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj zamówienia…" /></div>
        <div className="commerce-table-wrap"><table className="commerce-table"><thead><tr><th>Data</th><th>Kupujący</th><th>Produkty</th><th>Kwota</th><th>Status</th><th>Faktura</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id}><td>{date(order.createdAt)}</td><td><strong>{order.buyerName}</strong><small>{order.allegroOrderId.slice(0, 12)}…</small></td><td>{order.lineItems.map((line) => `${line.quantity}× ${line.name}`).join(", ")}</td><td>{money(order.paidAmount)}</td><td><select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value as OrderStatus)}>{Object.entries(orderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td>{order.invoiceId || invoices.some((invoice) => invoice.orderId === order.id) ? <button className="table-action" onClick={() => setSelectedInvoice(invoices.find((invoice) => invoice.orderId === order.id) ?? null)}>Pokaż</button> : <button className="table-action" onClick={() => addInvoice(order)}>Wystaw</button>}</td></tr>)}</tbody></table></div>
      </article> : null}

      {tab === "invoices" ? <article className="commerce-card">
        <div className="commerce-card-heading"><div><h3>Faktury</h3><p>Dokumenty z zamówień Allegro i faktury ręczne.</p></div><button className="button button-dark" onClick={() => setManualOpen(true)}>+ Nowa faktura</button></div>
        <div className="commerce-table-wrap"><table className="commerce-table"><thead><tr><th>Numer</th><th>Nabywca</th><th>Data</th><th>Brutto</th><th>Status</th><th></th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.number}</strong></td><td>{invoice.buyerName}</td><td>{invoice.issueDate}</td><td>{money(totals(invoice).gross)}</td><td><span className={`invoice-status-badge status-${invoice.status.toLowerCase()}`}>{invoiceLabels[invoice.status]}</span></td><td><button className="table-action" onClick={() => setSelectedInvoice(invoice)}>Podgląd</button></td></tr>)}</tbody></table></div>
      </article> : null}

      {tab === "allegro" ? <div className="commerce-grid">
        <article className="commerce-card integration-card"><h3>Integracja Allegro REST API</h3><p>Połączenie OAuth umożliwia pobieranie zamówień i opłat do rzeczywistych statystyk panelu.</p><dl><div><dt>Środowisko</dt><dd>{api.environment}</dd></div><div><dt>Konfiguracja</dt><dd>{api.configured ? "gotowa" : "brak zmiennych"}</dd></div><div><dt>Konto</dt><dd>{api.connected ? "połączone" : "niepołączone"}</dd></div></dl><div className="integration-actions"><a className="button button-dark" href="/api/allegro/connect">Połącz z Allegro</a><button className="button button-outline" disabled={syncing} onClick={() => void syncAllegro()}>{syncing ? "Synchronizuję…" : "Synchronizuj teraz"}</button></div>{api.missing?.length ? <p className="integration-warning">Brakuje: {api.missing.join(", ")}</p> : null}</article>
        <article className="commerce-card"><h3>Co synchronizujemy</h3><ul className="feature-list"><li>Zamówienia i pozycje zamówień</li><li>Statusy płatności i realizacji</li><li>Dane nabywcy do faktury</li><li>Opłaty i prowizje Allegro</li><li>Powiązanie przez SKU i ID oferty</li></ul></article>
      </div> : null}

      {tab === "tools" ? <>
        <div className="commerce-grid tools-grid">
          <article className="commerce-card"><div className="commerce-card-heading"><div><h3>Niskie stany magazynowe</h3><p>Próg: {settings.lowStockThreshold} szt.</p></div><span className="task-count">{lowStock.length}</span></div><div className="compact-list">{lowStock.map((product) => <div key={product.id}><div><strong>{product.name}</strong><small>{product.sku || "Brak SKU"}</small></div><span className="stock-pill low">{product.stock} szt.</span></div>)}</div></article>
          <article className="commerce-card"><h3>Kopia operacyjna</h3><p>Pobierz produkty, zamówienia, faktury i ustawienia do jednego pliku JSON.</p><button className="button button-outline" onClick={() => download(`nest-yard-backup-${new Date().toISOString().slice(0, 10)}.json`, { products, orders, invoices, settings })}>Pobierz kopię</button></article>
        </div>
        <article className="commerce-card"><div className="commerce-card-heading"><div><h3>Mapowanie produktów z Allegro</h3><p>SKU i ID oferty pozwalają przypisać sprzedaż do właściwego produktu.</p></div></div><div className="commerce-table-wrap"><table className="commerce-table"><thead><tr><th>Produkt</th><th>SKU</th><th>ID oferty</th><th>Stan</th><th>Mapowanie</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.sku || "—"}</td><td>{product.allegroOfferId || "—"}</td><td>{product.stock ?? "—"}</td><td><span className={product.sku && product.allegroOfferId ? "mapping-ok" : "mapping-missing"}>{product.sku && product.allegroOfferId ? "Gotowe" : "Uzupełnij"}</span></td></tr>)}</tbody></table></div></article>
        <article className="commerce-card settings-card"><h3>Dane sprzedawcy i faktur</h3><div className="settings-grid"><label>Nazwa firmy<input value={settings.sellerName} onChange={(event) => persistSettings({ ...settings, sellerName: event.target.value })} /></label><label>NIP<input value={settings.sellerTaxId} onChange={(event) => persistSettings({ ...settings, sellerTaxId: event.target.value })} /></label><label className="settings-wide">Adres<input value={settings.sellerAddress} onChange={(event) => persistSettings({ ...settings, sellerAddress: event.target.value })} /></label><label className="settings-wide">Rachunek bankowy<input value={settings.sellerBankAccount} onChange={(event) => persistSettings({ ...settings, sellerBankAccount: event.target.value })} /></label><label>Prefiks faktur<input value={settings.invoicePrefix} onChange={(event) => persistSettings({ ...settings, invoicePrefix: event.target.value.toUpperCase() })} /></label><label>Próg niskiego stanu<input type="number" min="0" value={settings.lowStockThreshold} onChange={(event) => persistSettings({ ...settings, lowStockThreshold: Number(event.target.value) })} /></label></div></article>
      </> : null}

      {selectedInvoice ? <div className="admin-modal-backdrop invoice-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedInvoice(null)}><section className="admin-modal invoice-modal"><div className="admin-modal-header no-print"><div><p className="eyebrow">Podgląd dokumentu</p><h2>{selectedInvoice.number}</h2></div><button onClick={() => setSelectedInvoice(null)}>×</button></div><InvoicePreview invoice={selectedInvoice} /><div className="invoice-modal-actions no-print"><select value={selectedInvoice.status} onChange={(event) => updateInvoice(selectedInvoice.id, event.target.value as InvoiceStatus)}>{Object.entries(invoiceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="button button-outline" onClick={() => window.print()}>Drukuj / zapisz PDF</button><button className="button button-dark" onClick={() => setNotice("Załączanie PDF do zamówienia wymaga docelowego magazynu plików i aktywnego konta Allegro.")}>Załącz do Allegro</button></div></section></div> : null}

      {manualOpen ? <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setManualOpen(false)}><section className="admin-modal manual-invoice-modal"><div className="admin-modal-header"><div><p className="eyebrow">Generator faktur</p><h2>Nowa faktura</h2></div><button onClick={() => setManualOpen(false)}>×</button></div><form className="product-form" onSubmit={createManual}><div className="form-grid"><label>Nabywca<input required value={manual.buyerName} onChange={(event) => setManual({ ...manual, buyerName: event.target.value })} /></label><label>NIP<input value={manual.buyerTaxId} onChange={(event) => setManual({ ...manual, buyerTaxId: event.target.value })} /></label><label className="field-wide">Adres<input value={manual.buyerAddress} onChange={(event) => setManual({ ...manual, buyerAddress: event.target.value })} /></label><label className="field-wide">E-mail<input type="email" value={manual.buyerEmail} onChange={(event) => setManual({ ...manual, buyerEmail: event.target.value })} /></label><label className="field-wide">Towar lub usługa<input required value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} /></label><label>Ilość<input type="number" min="0.01" step="0.01" value={manual.quantity} onChange={(event) => setManual({ ...manual, quantity: Number(event.target.value) })} /></label><label>Cena brutto<input type="number" min="0" step="0.01" value={manual.price || ""} onChange={(event) => setManual({ ...manual, price: Number(event.target.value) })} /></label><label>VAT<select value={manual.vat} onChange={(event) => setManual({ ...manual, vat: Number(event.target.value) })}><option value={23}>23%</option><option value={8}>8%</option><option value={5}>5%</option><option value={0}>0%</option></select></label></div><div className="form-actions"><button className="text-button" type="button" onClick={() => setManualOpen(false)}>Anuluj</button><button className="button button-dark" type="submit">Utwórz fakturę</button></div></form></section></div> : null}
    </section>
  );
}

function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const sum = totals(invoice);
  return <article className="invoice-document"><header><div><span className="invoice-logo">N&Y</span><strong>{invoice.sellerName}</strong><small>{invoice.sellerAddress}</small><small>NIP: {invoice.sellerTaxId}</small></div><div><p>FAKTURA</p><h1>{invoice.number}</h1><span className={`invoice-status-badge status-${invoice.status.toLowerCase()}`}>{invoiceLabels[invoice.status]}</span></div></header><section className="invoice-parties"><div><span>Sprzedawca</span><strong>{invoice.sellerName}</strong><p>{invoice.sellerAddress}<br />NIP: {invoice.sellerTaxId}<br />Rachunek: {invoice.sellerBankAccount}</p></div><div><span>Nabywca</span><strong>{invoice.buyerName}</strong><p>{invoice.buyerAddress}{invoice.buyerTaxId ? <><br />NIP: {invoice.buyerTaxId}</> : null}<br />{invoice.buyerEmail}</p></div></section><section className="invoice-dates"><div><span>Data wystawienia</span><strong>{invoice.issueDate}</strong></div><div><span>Data sprzedaży</span><strong>{invoice.saleDate}</strong></div><div><span>Termin płatności</span><strong>{invoice.dueDate}</strong></div><div><span>Płatność</span><strong>{invoice.paymentMethod}</strong></div></section><table><thead><tr><th>Lp.</th><th>Nazwa</th><th>Ilość</th><th>Cena brutto</th><th>VAT</th><th>Wartość</th></tr></thead><tbody>{invoice.lines.map((line, index) => <tr key={line.id}><td>{index + 1}</td><td><strong>{line.name}</strong></td><td>{line.quantity} {line.unit}</td><td>{money(line.unitGross)}</td><td>{line.vatRate}%</td><td>{money(line.quantity * line.unitGross)}</td></tr>)}</tbody></table><section className="invoice-summary"><div><p>{invoice.notes}</p>{invoice.ksefNumber ? <p>Numer KSeF: {invoice.ksefNumber}</p> : null}</div><div><p><span>Netto</span><strong>{money(sum.net)}</strong></p><p><span>VAT</span><strong>{money(sum.vat)}</strong></p><p className="invoice-total"><span>Do zapłaty</span><strong>{money(sum.gross)}</strong></p></div></section><footer>Dokument demonstracyjny Nest & Yard. Faktura ustrukturyzowana wymaga przyjęcia przez KSeF.</footer></article>;
}
