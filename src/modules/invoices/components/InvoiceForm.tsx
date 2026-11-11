import React from 'react';
import type { InvoiceData, InvoiceItem } from '../types';
import { Plus, Trash2, BookmarkCheck, RotateCcw } from 'lucide-react';
import { numberToIndianRupees } from '../utils/numberToWords';

interface InvoiceFormProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onReset: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onChange, onReset }) => {
  // Helper to recompute financial calculations
  const recalculate = (partial: Partial<InvoiceData>) => {
    const updated = { ...invoice, ...partial };
    const items = updated.items || [];

    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);

    let taxAmount = 0;
    if (updated.taxType !== 'NONE') {
      taxAmount = (subtotal * (Number(updated.taxRate) || 0)) / 100;
    }

    const totalAmount = subtotal + taxAmount;
    const balanceDue = totalAmount; // Default to full amount
    const totalInWords = numberToIndianRupees(totalAmount);

    onChange({
      ...updated,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue,
      totalInWords,
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(invoice.items || [])];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    if (field === 'quantity' || field === 'rate') {
      const q = Number(field === 'quantity' ? value : newItems[index].quantity) || 0;
      const r = Number(field === 'rate' ? value : newItems[index].rate) || 0;
      newItems[index].amount = q * r;
    }
    recalculate({ items: newItems });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      hsnSac: '998314',
      quantity: 1,
      rate: 0,
      taxRate: invoice.taxRate || 18,
      amount: 0,
    };
    recalculate({ items: [...(invoice.items || []), newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = (invoice.items || []).filter((_, i) => i !== index);
    recalculate({ items: newItems });
  };

  // Save biller & bank defaults to localStorage
  const handleSaveDefaults = () => {
    const defaults = {
      billerName: invoice.billerName,
      billerCompany: invoice.billerCompany,
      billerAddress: invoice.billerAddress,
      billerCity: invoice.billerCity,
      billerState: invoice.billerState,
      billerPincode: invoice.billerPincode,
      billerCountry: invoice.billerCountry,
      billerGstin: invoice.billerGstin,
      billerPhone: invoice.billerPhone,
      billerEmail: invoice.billerEmail,
      accountHolderName: invoice.accountHolderName,
      bankName: invoice.bankName,
      accountNumber: invoice.accountNumber,
      ifscCode: invoice.ifscCode,
      upiId: invoice.upiId,
      termsAndConditions: invoice.termsAndConditions,
      taxType: invoice.taxType,
      taxRate: invoice.taxRate,
    };
    localStorage.setItem('bb_erp_invoice_defaults', JSON.stringify(defaults));
    alert('Company & Bank details saved as your default template!');
  };

  return (
    <div className="space-y-6 text-sm text-gray-800 dark:text-gray-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg text-xs font-semibold transition border border-blue-200 dark:border-blue-900"
            title="Save your company and bank details as default for all future invoices"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Save Biller Defaults</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Invoice Meta Section */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
          1. Invoice Meta
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Invoice #
            </label>
            <input
              type="text"
              value={invoice.invoiceNumber}
              onChange={(e) => onChange({ ...invoice, invoiceNumber: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-mono"
              placeholder="INV-000367"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoice.invoiceDate}
              onChange={(e) => onChange({ ...invoice, invoiceDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={invoice.dueDate}
              onChange={(e) => onChange({ ...invoice, dueDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Terms
            </label>
            <input
              type="text"
              value={invoice.terms}
              onChange={(e) => onChange({ ...invoice, terms: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
              placeholder="Custom / Net 30"
            />
          </div>
        </div>
      </div>

      {/* Biller Info (Your Company) */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            2. Biller Information (Your Business)
          </h4>
          <span className="text-[11px] text-gray-400 italic">Appears at top left</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Business / Company Name
            </label>
            <input
              type="text"
              value={invoice.billerCompany}
              onChange={(e) => onChange({ ...invoice, billerCompany: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. AGARWAL CREATION"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Biller Trade Name / Sub-Name
            </label>
            <input
              type="text"
              value={invoice.billerName}
              onChange={(e) => onChange({ ...invoice, billerName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. AGARWAL CREATION"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Address Lines
            </label>
            <textarea
              rows={2}
              value={invoice.billerAddress}
              onChange={(e) => onChange({ ...invoice, billerAddress: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
              placeholder="185, Chetak Vihar, Agra Road, Jamdoli"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              City
            </label>
            <input
              type="text"
              value={invoice.billerCity}
              onChange={(e) => onChange({ ...invoice, billerCity: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Jaipur"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              State & Pincode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invoice.billerState}
                onChange={(e) => onChange({ ...invoice, billerState: e.target.value })}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="Rajasthan"
              />
              <input
                type="text"
                value={invoice.billerPincode}
                onChange={(e) => onChange({ ...invoice, billerPincode: e.target.value })}
                className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                placeholder="302031"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Biller GSTIN
            </label>
            <input
              type="text"
              value={invoice.billerGstin}
              onChange={(e) => onChange({ ...invoice, billerGstin: e.target.value.toUpperCase() })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
              placeholder="08AAAAA0000A1Z5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Country
            </label>
            <input
              type="text"
              value={invoice.billerCountry}
              onChange={(e) => onChange({ ...invoice, billerCountry: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="India"
            />
          </div>
        </div>
      </div>

      {/* Client Details (Bill To) */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            3. Client Details (Bill To)
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Client Company Name
            </label>
            <input
              type="text"
              value={invoice.clientCompany}
              onChange={(e) => onChange({ ...invoice, clientCompany: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
              placeholder="NS PROPERTY GUIDE ADVISORS PRIVATE LIMITED"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Client Contact Person (Optional)
            </label>
            <input
              type="text"
              value={invoice.clientName}
              onChange={(e) => onChange({ ...invoice, clientName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Client Address
            </label>
            <textarea
              rows={2}
              value={invoice.clientAddress}
              onChange={(e) => onChange({ ...invoice, clientAddress: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Plot No 42, Hitech City, Hyderabad"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Client GSTIN
            </label>
            <input
              type="text"
              value={invoice.clientGstin}
              onChange={(e) => onChange({ ...invoice, clientGstin: e.target.value.toUpperCase() })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
              placeholder="36AAGCN6697K1ZO"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Place Of Supply
            </label>
            <input
              type="text"
              value={invoice.placeOfSupply}
              onChange={(e) => onChange({ ...invoice, placeOfSupply: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Telangana (36)"
            />
          </div>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            4. Line Items
          </h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {(invoice.items || []).map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Item Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium"
                    placeholder="e.g. AI Automation / IT Services – PropCheck"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    HSN / SAC
                  </label>
                  <input
                    type="text"
                    value={item.hsnSac}
                    onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                    placeholder="998314"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="mt-5 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Line Total
                  </label>
                  <div className="px-2.5 py-1.5 text-xs rounded bg-gray-100 dark:bg-zinc-900 font-mono font-bold text-gray-800 dark:text-gray-200">
                    ₹{(Number(item.quantity || 0) * Number(item.rate || 0)).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Totals Section */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
          5. Tax & Pricing
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              GST Tax Type
            </label>
            <select
              value={invoice.taxType}
              onChange={(e) => recalculate({ taxType: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="IGST">Integrated Tax (IGST) - Interstate</option>
              <option value="CGST_SGST">Central & State Tax (CGST + SGST) - Intrastate</option>
              <option value="NONE">No Tax (0%)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Tax Rate %
            </label>
            <select
              value={invoice.taxRate}
              onChange={(e) => recalculate({ taxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value={18}>18% (Standard IT / Services)</option>
              <option value={12}>12%</option>
              <option value={5}>5%</option>
              <option value={28}>28%</option>
              <option value={0}>0% (Exempt)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
          6. Bank Details (Payment Information)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={invoice.accountHolderName}
              onChange={(e) => onChange({ ...invoice, accountHolderName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Shashi Kumar"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={invoice.bankName}
              onChange={(e) => onChange({ ...invoice, bankName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="State Bank of India (SBI)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={invoice.accountNumber}
              onChange={(e) => onChange({ ...invoice, accountNumber: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              placeholder="61293484821"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              IFSC Code
            </label>
            <input
              type="text"
              value={invoice.ifscCode}
              onChange={(e) => onChange({ ...invoice, ifscCode: e.target.value.toUpperCase() })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
              placeholder="SBIN0006827"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              UPI ID (Optional)
            </label>
            <input
              type="text"
              value={invoice.upiId}
              onChange={(e) => onChange({ ...invoice, upiId: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              placeholder="name@upi"
            />
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
          7. Notes & Terms
        </h4>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Notes / Thank You Message
          </label>
          <input
            type="text"
            value={invoice.notes}
            onChange={(e) => onChange({ ...invoice, notes: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            placeholder="Thanks for your business."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Terms & Conditions (Optional)
          </label>
          <textarea
            rows={2}
            value={invoice.termsAndConditions}
            onChange={(e) => onChange({ ...invoice, termsAndConditions: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            placeholder="Payment is due within specified terms. Late fees may apply."
          />
        </div>
      </div>
    </div>
  );
};
