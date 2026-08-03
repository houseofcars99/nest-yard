export type OrderStatus =
  | "NEW"
  | "PROCESSING"
  | "READY_FOR_SHIPMENT"
  | "SENT"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "PARTIALLY_REFUNDED";

export type OrderLine = {
  id: string;
  productId: string;
  offerId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type AllegroOrder = {
  id: string;
  allegroOrderId: string;
  createdAt: string;
  updatedAt: string;
  buyerName: string;
  buyerLogin: string;
  buyerEmail: string;
  buyerTaxId: string;
  deliveryAddress: string;
  deliveryMethod: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  deliveryCost: number;
  allegroFees: number;
  invoiceRequested: boolean;
  invoiceId: string | null;
  trackingNumber: string;
  lineItems: OrderLine[];
};

export type InvoiceStatus = "DRAFT" | "ISSUED" | "KSEF_PENDING" | "KSEF_SENT" | "PAID" | "CANCELLED";

export type InvoiceLine = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitGross: number;
  vatRate: number;
};

export type Invoice = {
  id: string;
  number: string;
  orderId: string | null;
  allegroOrderId: string | null;
  issueDate: string;
  saleDate: string;
  dueDate: string;
  paymentMethod: string;
  sellerName: string;
  sellerTaxId: string;
  sellerAddress: string;
  sellerBankAccount: string;
  buyerName: string;
  buyerTaxId: string;
  buyerAddress: string;
  buyerEmail: string;
  notes: string;
  status: InvoiceStatus;
  ksefNumber: string;
  lines: InvoiceLine[];
};

export type StoreSettings = {
  sellerName: string;
  sellerTaxId: string;
  sellerAddress: string;
  sellerBankAccount: string;
  invoicePrefix: string;
  lowStockThreshold: number;
  defaultVatRate: number;
};
