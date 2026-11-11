import { useState } from 'react';
import type { InvoiceData } from '../types';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
import { InvoiceForm } from '../components/InvoiceForm';
import { SavedInvoicesDrawer } from '../components/SavedInvoicesDrawer';
import { exportToPdf, printInvoice } from '../utils/exportPdf';
import { exportToDocx } from '../utils/exportDocx';
import { useSaveInvoice } from '../api/invoicesApi';
import {
  Download,
  FileDown,
  Printer,
  Save,
  FolderOpen,
  PlusCircle,
  Eye,
  Edit3,
  Loader2,
  Check,
} from 'lucide-react';

const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: 'INV-000367',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  terms: 'Custom',
  status: 'SAVED',

  // Biller details (Pre-seeded with user's company template)
  billerName: 'AGARWAL CREATION',
  billerCompany: 'AGARWAL CREATION',
  billerAddress: '185, Chetak Vihar, Agra Road, Jamdoli',
  billerCity: 'Jaipur',
  billerState: 'Rajasthan',
  billerPincode: '302031',
  billerCountry: 'India',
  billerGstin: '',
  billerPhone: '',
  billerEmail: '',

  // Client details
  clientName: '',
  clientCompany: 'NS PROPERTY GUIDE ADVISORS PRIVATE LIMITED',
  clientAddress: '',
  clientCity: '',
  clientState: 'Telangana',
  clientPincode: '',
  clientCountry: 'India',
  clientGstin: '36AAGCN6697K1ZO',
  clientPhone: '',
  clientEmail: '',
  placeOfSupply: 'Telangana (36)',

  // Bank details
  accountHolderName: 'Shashi Kumar',
  bankName: 'State Bank of India (SBI)',
  accountNumber: '61293484821',
  ifscCode: 'SBIN0006827',
  upiId: '',

  // Calculations
  currency: 'INR',
  items: [
    {
      id: 'item-1',
      description: 'AI Automation / IT Services – PropCheck',
      hsnSac: '998314',
      quantity: 1,
      rate: 17400,
      taxRate: 18,
      amount: 17400,
    },
  ],
  subtotal: 17400,
  taxType: 'IGST',
  taxRate: 18,
  taxAmount: 3132,
  totalAmount: 20532,
  balanceDue: 20532,
  totalInWords: 'Indian Rupee Twenty Thousand Five Hundred Thirty-Two Only',
  notes: 'Thanks for your business.',
  termsAndConditions: '',
};

export default function InvoicesPage() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    // Try restoring defaults from localStorage
    const savedDefaults = localStorage.getItem('bb_erp_invoice_defaults');
    if (savedDefaults) {
      try {
        const parsed = JSON.parse(savedDefaults);
        return {
          ...DEFAULT_INVOICE,
          ...parsed,
        };
      } catch (e) {
        console.error('Failed to parse invoice defaults', e);
      }
    }
    return DEFAULT_INVOICE;
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveMutation = useSaveInvoice();

  // Handle Save to DB
  const handleSaveToDb = async () => {
    try {
      const saved = await saveMutation.mutateAsync(invoice);
      setInvoice((prev) => ({ ...prev, id: saved.id }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save invoice', e);
      alert('Error saving invoice. Please check the backend connection.');
    }
  };

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportToPdf(invoice);
    } catch (e) {
      console.error('Failed to export PDF', e);
      alert('PDF generation encountered an issue. You can also use the "Print" button to save as PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle DOCX Export
  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      await exportToDocx(invoice);
    } catch (e) {
      console.error('Failed to export DOCX', e);
      alert('Failed to generate DOCX file.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Handle New Invoice
  const handleNewInvoice = () => {
    const nextNum = 'INV-' + String(Math.floor(100000 + Math.random() * 900000));
    setInvoice({
      ...DEFAULT_INVOICE,
      id: undefined,
      invoiceNumber: nextNum,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      clientCompany: '',
      clientName: '',
      clientAddress: '',
      clientGstin: '',
      items: [
        {
          id: Math.random().toString(36).substring(2, 9),
          description: '',
          hsnSac: '998314',
          quantity: 1,
          rate: 0,
          taxRate: 18,
          amount: 0,
        },
      ],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      balanceDue: 0,
      totalInWords: 'Indian Rupee Zero Only',
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-zinc-950 overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 shrink-0 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Download className="w-5 h-5 rotate-180" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 dark:text-white">
                Tax Invoice Studio
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {invoice.invoiceNumber || 'NEW'}
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Side-by-side interactive invoice builder with instant PDF & Word export
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Tab Toggle */}
          <div className="lg:hidden flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-gray-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg border border-gray-300 dark:border-zinc-700 transition shadow-xs cursor-pointer"
            title="Browse and load saved invoices"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saved Invoices</span>
          </button>

          <button
            onClick={handleNewInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg border border-gray-300 dark:border-zinc-700 transition shadow-xs cursor-pointer"
            title="Start a new blank invoice"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>

          <button
            onClick={handleSaveToDb}
            disabled={saveMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition border shadow-xs cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
            title="Save invoice into backend database"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? 'Saved!' : 'Save DB'}</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg border border-indigo-200 dark:border-indigo-800 transition shadow-xs cursor-pointer"
            title="Download editable Microsoft Word DOCX"
          >
            {isExportingDocx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>Word (.docx)</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
            title="Download high-resolution PDF invoice"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>PDF</span>
          </button>

          <button
            onClick={printInvoice}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
            title="Print or Save via Browser (Vector PDF)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace (Side-by-Side) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Interactive Form (Scrollable) */}
        <section
          className={`w-full lg:w-[460px] xl:w-[500px] shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto p-4 sm:p-5 ${
            activeTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          <InvoiceForm
            invoice={invoice}
            onChange={(updated) => setInvoice(updated)}
            onReset={handleNewInvoice}
          />
        </section>

        {/* Right Pane: Live Printable Preview (Zoho-Style Paper on Desk) */}
        <section
          className={`flex-1 bg-gray-200/80 dark:bg-zinc-950 overflow-y-auto p-4 sm:p-8 flex justify-center items-start ${
            activeTab === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="w-full max-w-[850px] flex flex-col items-center">
            {/* Live Preview Paper Header */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-3 text-xs text-gray-500 dark:text-gray-400 px-1">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Real-Time Invoice Preview (A4)
              </span>
              <span>Rendered pixel-perfect to sample</span>
            </div>

            {/* Printable Invoice Component */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <InvoiceTemplate invoice={invoice} />
            </div>
          </div>
        </section>
      </div>

      {/* Saved Invoices Drawer */}
      <SavedInvoicesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelect={(loaded) => setInvoice(loaded)}
      />
    </div>
  );
}
