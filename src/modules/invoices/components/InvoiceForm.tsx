import React from 'react';
import type { InvoiceData, InvoiceItem } from '../types';
import { Plus, Trash2, BookmarkCheck, RotateCcw, Building2, MapPin } from 'lucide-react';
import { numberToIndianRupees } from '../utils/numberToWords';
import {
  getStateFromGstin,
  determineTaxType,
  sanitizeBusinessName,
} from '../utils/gstUtils';
import { DEFAULT_SIGNATURE_DATA_URI } from '../assets/signatureDataUri';

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

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    );

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

  // Handle Client GSTIN change with smart state and tax type detection
  const handleClientGstinChange = (rawGstin: string) => {
    const gstin = rawGstin.toUpperCase();
    const detectedState = getStateFromGstin(gstin);

    if (detectedState) {
      const pos = `${detectedState.name} (${detectedState.code})`;
      const autoTaxType = determineTaxType(invoice.billerStateCode || '08', detectedState.code);

      recalculate({
        clientGstin: gstin,
        clientState: detectedState.name,
        clientStateCode: detectedState.code,
        placeOfSupply: pos,
        taxType: autoTaxType,
      });
    } else {
      recalculate({ clientGstin: gstin });
    }
  };

  // Handle Place of Supply change with auto tax type detection
  const handlePlaceOfSupplyChange = (pos: string) => {
    const autoTaxType = determineTaxType(invoice.billerStateCode || '08', pos);
    recalculate({
      placeOfSupply: pos,
      taxType: autoTaxType,
    });
  };

  // Save biller & bank defaults to localStorage
  const handleSaveDefaults = () => {
    const defaults = {
      billerName: sanitizeBusinessName(invoice.billerName, 'AGARWAL CREATION'),
      billerCompany: sanitizeBusinessName(invoice.billerCompany, 'AGARWAL CREATION'),
      billerAddress: invoice.billerAddress,
      billerCity: invoice.billerCity,
      billerState: invoice.billerState,
      billerPincode: invoice.billerPincode,
      billerCountry: invoice.billerCountry,
      billerGstin: invoice.billerGstin,
      billerPhone: invoice.billerPhone,
      billerEmail: invoice.billerEmail,
      billerStateCode: invoice.billerStateCode || '08',
      accountHolderName: sanitizeBusinessName(invoice.accountHolderName, 'AGARWAL CREATION'),
      bankName: invoice.bankName,
      accountNumber: invoice.accountNumber,
      ifscCode: invoice.ifscCode,
      upiId: invoice.upiId,
      termsAndConditions: invoice.termsAndConditions,
      taxType: invoice.taxType,
      taxRate: invoice.taxRate,
      reverseCharge: invoice.reverseCharge || 'No',
      showSignature: invoice.showSignature !== false,
      signatureUrl: invoice.signatureUrl || DEFAULT_SIGNATURE_DATA_URI,
    };
    localStorage.setItem('bb_erp_invoice_defaults', JSON.stringify(defaults));
    alert('AGARWAL CREATION business & bank details saved as default template!');
  };

  return (
    <div className="space-y-6 text-sm text-gray-800 dark:text-gray-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg text-xs font-semibold transition border border-blue-200 dark:border-blue-900 cursor-pointer"
            title="Save business details as your default template"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Save Seller Defaults</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Reference</span>
        </button>
      </div>

      {/* Invoice Meta Section */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
          1. Invoice Details
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
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
              placeholder="INV-000602"
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
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-mono"
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
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-mono"
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
              placeholder="Due on Receipt / Custom"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Reverse Charge Applicable?
            </label>
            <select
              value={invoice.reverseCharge || 'No'}
              onChange={(e) => onChange({ ...invoice, reverseCharge: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="No">No (Default)</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Invoice Status
            </label>
            <select
              value={invoice.status || 'SAVED'}
              onChange={(e) => onChange({ ...invoice, status: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SAVED">SAVED</option>
              <option value="SENT">SENT</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seller Details (AGARWAL CREATION) */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Seller / Business Details (Trade Name)</span>
          </h4>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
            GST Active • Regular
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Business / Trade Name (Primary Identity)
            </label>
            <input
              type="text"
              value={invoice.billerCompany}
              onChange={(e) =>
                onChange({
                  ...invoice,
                  billerCompany: e.target.value,
                  billerName: e.target.value,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-bold"
              placeholder="AGARWAL CREATION"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Registered Business Address
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Seller GSTIN (Rajasthan)
            </label>
            <input
              type="text"
              value={invoice.billerGstin}
              onChange={(e) => onChange({ ...invoice, billerGstin: e.target.value.toUpperCase() })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-bold uppercase tracking-wider"
              placeholder="08ECMPK5176F1Z8"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              State Code
            </label>
            <input
              type="text"
              value={invoice.billerStateCode || '08'}
              onChange={(e) => onChange({ ...invoice, billerStateCode: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              placeholder="08 (Rajasthan)"
            />
          </div>
        </div>
      </div>

      {/* Client Details (Bill To) */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
            3. Client Details (Bill To)
          </h4>
          <span className="text-[11px] text-gray-400 italic">Recipient GST info</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Customer / Legal Business Name
            </label>
            <input
              type="text"
              value={invoice.clientCompany}
              onChange={(e) => onChange({ ...invoice, clientCompany: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-semibold"
              placeholder="NORTHSTAR HOMES & SPACES PRIVATE LIMITED"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Customer GSTIN (Auto-detects State & Tax)
            </label>
            <input
              type="text"
              value={invoice.clientGstin}
              onChange={(e) => handleClientGstinChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-semibold uppercase tracking-wider"
              placeholder="36AAICN4857H1Z3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Place Of Supply
            </label>
            <div className="relative">
              <input
                type="text"
                value={invoice.placeOfSupply}
                onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                placeholder="Telangana (36)"
              />
            </div>
          </div>

          {/* Quick Place of Supply suggestions */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Quick POS:
              </span>
              {[
                { name: 'Telangana', code: '36' },
                { name: 'Rajasthan', code: '08' },
                { name: 'Maharashtra', code: '27' },
                { name: 'Karnataka', code: '29' },
                { name: 'Delhi', code: '07' },
                { name: 'Uttar Pradesh', code: '09' },
              ].map((st) => {
                const label = `${st.name} (${st.code})`;
                const isSelected = invoice.placeOfSupply === label;
                return (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => handlePlaceOfSupplyChange(label)}
                    className={`px-2 py-0.5 text-[11px] rounded transition border ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700 font-semibold'
                        : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-100'
                    }`}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Billing Address
            </label>
            <textarea
              rows={2}
              value={invoice.clientAddress}
              onChange={(e) => onChange({ ...invoice, clientAddress: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Hyderabad, Telangana"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Customer State
            </label>
            <input
              type="text"
              value={invoice.clientState}
              onChange={(e) => onChange({ ...invoice, clientState: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Telangana"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Contact Person (Optional)
            </label>
            <input
              type="text"
              value={invoice.clientName}
              onChange={(e) => onChange({ ...invoice, clientName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              placeholder="Accounts Department"
            />
          </div>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
            4. Line Items & Services
          </h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {(invoice.items || []).map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 space-y-2 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Service Description
                  </label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium"
                    placeholder="Website Design & Front-End Development Services for Northstar Homes Official Website (Final Delivery)"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    SAC / HSN
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
                  className="mt-5 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition cursor-pointer"
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
                    onChange={(e) =>
                      handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Taxable Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={item.rate}
                    onChange={(e) =>
                      handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
                    Taxable Value
                  </label>
                  <div className="px-2.5 py-1.5 text-xs rounded bg-slate-100 dark:bg-zinc-900 font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹
                    {(
                      Number(item.quantity || 0) * Number(item.rate || 0)
                    ).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Tax & Totals Section */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
            5. Dynamic GST Tax & Pricing
          </h4>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            {invoice.taxType === 'IGST'
              ? 'Interstate: IGST Applied'
              : invoice.taxType === 'CGST_SGST'
              ? 'Intrastate: CGST + SGST Applied'
              : 'Zero / Exempt Tax'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              GST Tax Type
            </label>
            <select
              value={invoice.taxType}
              onChange={(e) => recalculate({ taxType: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="IGST">Integrated Tax (IGST) - Interstate</option>
              <option value="CGST_SGST">Central & State Tax (CGST + SGST) - Intrastate</option>
              <option value="NONE">No Tax (0% / Exempt)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Applicable GST Rate %
            </label>
            <select
              value={invoice.taxRate}
              onChange={(e) => recalculate({ taxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value={18}>18% (Standard IT & Software Services)</option>
              <option value={12}>12%</option>
              <option value={5}>5%</option>
              <option value={28}>28%</option>
              <option value={0}>0% (Exempt / Nil)</option>
            </select>
          </div>
        </div>

        {/* Real-time Calculation Summary Preview */}
        <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs space-y-1.5">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Taxable Subtotal:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              ₹{(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {invoice.taxType === 'IGST' && (
            <div className="flex justify-between text-blue-700 dark:text-blue-300 font-medium">
              <span>IGST ({invoice.taxRate}%):</span>
              <span className="font-mono font-bold">
                ₹{(invoice.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {invoice.taxType === 'CGST_SGST' && (
            <>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-medium">
                <span>CGST ({(invoice.taxRate || 0) / 2}%):</span>
                <span className="font-mono font-bold">
                  ₹{((invoice.taxAmount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-medium">
                <span>SGST ({(invoice.taxRate || 0) / 2}%):</span>
                <span className="font-mono font-bold">
                  ₹{((invoice.taxAmount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between text-sm font-bold text-gray-950 dark:text-white pt-1.5 border-t border-gray-200 dark:border-zinc-700">
            <span>Total Value:</span>
            <span className="font-mono">
              ₹{(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
          6. Bank Details (Payment Information)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Account Name (Trade Name)
            </label>
            <input
              type="text"
              value={invoice.accountHolderName}
              onChange={(e) => onChange({ ...invoice, accountHolderName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
              placeholder="AGARWAL CREATION"
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
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-bold"
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
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase font-bold"
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
              placeholder="e.g. agarwalcreation@sbi"
            />
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
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
            placeholder="Payment is due upon receipt. All disputes are subject to Jaipur jurisdiction."
          />
        </div>
      </div>

      {/* 8. Authorised Signatory & Signature */}
      <div className="bg-gray-50/70 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
            8. Authorised Signatory & Signature
          </h4>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={invoice.showSignature !== false}
              onChange={(e) => onChange({ ...invoice, showSignature: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Include Signature</span>
          </label>
        </div>

        {invoice.showSignature !== false && (
          <div className="flex items-center gap-4 pt-1">
            <div className="h-16 w-32 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800/80 p-1">
              <img
                src={invoice.signatureUrl || DEFAULT_SIGNATURE_DATA_URI}
                alt="Signature preview"
                className="max-h-full max-w-full object-contain mix-blend-multiply"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer">
                  <span>Upload Custom Sign</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const res = event.target?.result as string;
                        if (res) {
                          onChange({ ...invoice, signatureUrl: res, showSignature: true });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {invoice.signatureUrl && invoice.signatureUrl !== DEFAULT_SIGNATURE_DATA_URI && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...invoice, signatureUrl: DEFAULT_SIGNATURE_DATA_URI })}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset to Default Sign
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Default signature applied automatically with transparent background.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
