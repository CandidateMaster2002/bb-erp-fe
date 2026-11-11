export interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  taxRate: number; // percentage, e.g. 18
  amount: number; // quantity * rate
}

export interface InvoiceData {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  status: 'DRAFT' | 'SAVED' | 'SENT' | 'PAID' | 'CANCELLED';

  // Biller details
  billerName: string;
  billerCompany: string;
  billerAddress: string;
  billerCity: string;
  billerState: string;
  billerPincode: string;
  billerCountry: string;
  billerGstin: string;
  billerPhone: string;
  billerEmail: string;

  // Client details
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientPincode: string;
  clientCountry: string;
  clientGstin: string;
  clientPhone: string;
  clientEmail: string;
  placeOfSupply: string;

  // Bank details
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;

  // Calculations
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  taxType: 'IGST' | 'CGST_SGST' | 'NONE';
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  totalInWords: string;
  notes: string;
  termsAndConditions: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface SavedInvoiceListItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientCompany: string;
  clientName: string;
  totalAmount: number;
  balanceDue: number;
  status: string;
  createdAt: string;
}
