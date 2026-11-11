import React from 'react';
import type { InvoiceData } from '../types';

export function formatINR(val: number): string {
  if (val == null || isNaN(val)) return '0.00';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  scale?: number;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, scale = 1 }) => {
  const isCgstSgst = invoice.taxType === 'CGST_SGST';
  const halfTaxRate = (invoice.taxRate || 0) / 2;
  const halfTaxAmount = (invoice.taxAmount || 0) / 2;

  return (
    <div
      id="invoice-printable-template"
      className="bg-white text-gray-900 mx-auto shadow-lg print:shadow-none print:m-0"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 18mm',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: '1.45',
        color: '#1e293b',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {/* Top Header Row */}
      <div className="flex justify-between items-start pb-6 border-b border-gray-100">
        {/* Left: Biller Details */}
        <div className="max-w-[55%]">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-950 uppercase leading-none">
            {invoice.billerCompany || invoice.billerName || 'YOUR COMPANY NAME'}
          </h1>
          {invoice.billerCompany && invoice.billerName && invoice.billerCompany !== invoice.billerName && (
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{invoice.billerName}</p>
          )}
          <div className="text-xs text-gray-600 mt-2 space-y-0.5 leading-relaxed">
            {invoice.billerAddress && <p>{invoice.billerAddress}</p>}
            {(invoice.billerCity || invoice.billerState || invoice.billerPincode) && (
              <p>
                {[invoice.billerCity, invoice.billerState, invoice.billerPincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {invoice.billerCountry && <p>{invoice.billerCountry}</p>}
            {invoice.billerGstin && (
              <p className="font-medium text-gray-800 pt-0.5">
                <span className="text-gray-500 font-normal">GSTIN:</span> {invoice.billerGstin}
              </p>
            )}
            {invoice.billerPhone && (
              <p>
                <span className="text-gray-500">Phone:</span> {invoice.billerPhone}
              </p>
            )}
            {invoice.billerEmail && (
              <p>
                <span className="text-gray-500">Email:</span> {invoice.billerEmail}
              </p>
            )}
          </div>
        </div>

        {/* Right: Tax Invoice Title & Balance Due Banner */}
        <div className="text-right flex flex-col items-end">
          <h2 className="text-2xl font-black tracking-wider text-gray-950 uppercase">
            TAX INVOICE
          </h2>
          <p className="text-sm font-semibold text-gray-700 mt-1">
            # {invoice.invoiceNumber || 'INV-000001'}
          </p>

          {/* Balance Due Highlight Box */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded px-4 py-2 text-right min-w-[170px]">
            <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase block">
              Balance Due
            </span>
            <span className="text-xl font-extrabold text-gray-950 block mt-0.5">
              ₹{formatINR(invoice.balanceDue ?? invoice.totalAmount ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Bill To & Invoice Meta Information */}
      <div className="flex justify-between items-start py-6 border-b border-gray-100">
        {/* Bill To */}
        <div className="max-w-[55%]">
          <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase block mb-1.5">
            Bill To
          </span>
          <h3 className="text-sm font-bold text-blue-900 uppercase">
            {invoice.clientCompany || invoice.clientName || 'CLIENT COMPANY / NAME'}
          </h3>
          {invoice.clientCompany && invoice.clientName && invoice.clientCompany !== invoice.clientName && (
            <p className="text-xs text-gray-600 mt-0.5">{invoice.clientName}</p>
          )}
          <div className="text-xs text-gray-600 mt-1.5 space-y-0.5 leading-relaxed">
            {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
            {(invoice.clientCity || invoice.clientState || invoice.clientPincode) && (
              <p>
                {[invoice.clientCity, invoice.clientState, invoice.clientPincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {invoice.clientCountry && <p>{invoice.clientCountry}</p>}
            {invoice.clientGstin && (
              <p className="font-semibold text-gray-800 pt-0.5">
                <span className="text-gray-500 font-normal">GSTIN:</span> {invoice.clientGstin}
              </p>
            )}
            {invoice.placeOfSupply && (
              <p className="font-medium text-gray-800">
                <span className="text-gray-500 font-normal">Place Of Supply:</span>{' '}
                {invoice.placeOfSupply}
              </p>
            )}
            {invoice.clientPhone && (
              <p>
                <span className="text-gray-500">Phone:</span> {invoice.clientPhone}
              </p>
            )}
            {invoice.clientEmail && (
              <p>
                <span className="text-gray-500">Email:</span> {invoice.clientEmail}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="text-right space-y-1.5 text-xs text-gray-700 min-w-[210px]">
          <div className="flex justify-between gap-4">
            <span className="font-medium text-gray-500">Invoice Date :</span>
            <span className="font-bold text-gray-900">{invoice.invoiceDate || '-'}</span>
          </div>
          {invoice.terms && (
            <div className="flex justify-between gap-4">
              <span className="font-medium text-gray-500">Terms :</span>
              <span className="font-semibold text-gray-800">{invoice.terms}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="font-medium text-gray-500">Due Date :</span>
            <span className="font-bold text-gray-900">{invoice.dueDate || '-'}</span>
          </div>
        </div>
      </div>

      {/* Items Table with Classic Zoho Dark Header */}
      <div className="mt-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#232323] text-white">
              <th className="py-2.5 px-3 text-center font-bold uppercase w-10">#</th>
              <th className="py-2.5 px-3 text-left font-bold uppercase">Item & Description</th>
              <th className="py-2.5 px-3 text-left font-bold uppercase w-24">HSN/SAC</th>
              <th className="py-2.5 px-3 text-right font-bold uppercase w-16">Qty</th>
              <th className="py-2.5 px-3 text-right font-bold uppercase w-24">Rate</th>
              {invoice.taxType !== 'NONE' && (
                <th className="py-2.5 px-3 text-right font-bold uppercase w-24">
                  {invoice.taxType === 'IGST' ? 'IGST' : 'GST'}
                </th>
              )}
              <th className="py-2.5 px-3 text-right font-bold uppercase w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => {
                const itemAmount = (item.quantity || 0) * (item.rate || 0);
                const itemTax = (itemAmount * (item.taxRate || invoice.taxRate || 0)) / 100;
                return (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3 text-center text-gray-500 font-mono font-medium align-top">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 text-gray-900 align-top">
                      <p className="font-semibold text-gray-950 whitespace-pre-line">
                        {item.description || 'Service / Product item'}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-gray-600 align-top font-mono">
                      {item.hsnSac || '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-800 align-top font-mono">
                      {Number(item.quantity || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-800 align-top font-mono">
                      {formatINR(item.rate || 0)}
                    </td>
                    {invoice.taxType !== 'NONE' && (
                      <td className="py-3 px-3 text-right text-gray-800 align-top font-mono">
                        <div>{formatINR(itemTax)}</div>
                        <div className="text-[10px] text-gray-500">
                          {item.taxRate || invoice.taxRate || 0}%
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-3 text-right font-bold text-gray-950 align-top font-mono">
                      {formatINR(itemAmount)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 italic">
                  No items added yet. Add items using the form on the left.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Section: Left (In Words & Bank) + Right (Subtotal & Taxes) */}
      <div className="mt-6 flex justify-between items-start gap-8 pt-4 border-t border-gray-200">
        {/* Left Side: Total in Words, Notes, and Bank Details */}
        <div className="flex-1 space-y-4">
          {/* Total In Words */}
          <div className="text-xs">
            <span className="font-bold text-gray-900 block mb-0.5">Total In Words:</span>
            <p className="italic text-gray-700 leading-relaxed font-serif">
              {invoice.totalInWords || 'Indian Rupee Zero Only'}
            </p>
          </div>

          {/* Friendly Note */}
          <div className="text-xs text-gray-600 italic">
            {invoice.notes || 'Thanks for your business.'}
          </div>

          {/* Bank Details Box */}
          {(invoice.bankName || invoice.accountNumber || invoice.accountHolderName) && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs space-y-1 max-w-[340px]">
              <div className="font-bold text-gray-800 pb-1 border-b border-gray-200 uppercase tracking-wide text-[10px]">
                Bank Details
              </div>
              {invoice.accountHolderName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Holder Name:</span>
                  <span className="font-semibold text-gray-900 text-right">{invoice.accountHolderName}</span>
                </div>
              )}
              {invoice.bankName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank Name:</span>
                  <span className="font-semibold text-gray-900 text-right">{invoice.bankName}</span>
                </div>
              )}
              {invoice.accountNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Number:</span>
                  <span className="font-mono font-bold text-gray-950 text-right">{invoice.accountNumber}</span>
                </div>
              )}
              {invoice.ifscCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">IFSC Code:</span>
                  <span className="font-mono font-semibold text-gray-900 text-right">{invoice.ifscCode}</span>
                </div>
              )}
              {invoice.upiId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">UPI ID:</span>
                  <span className="font-mono font-medium text-emerald-700 text-right">{invoice.upiId}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Financial Calculations */}
        <div className="w-[280px] shrink-0 text-xs">
          <div className="space-y-2 pb-3">
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Sub Total</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatINR(invoice.subtotal || 0)}
              </span>
            </div>

            {invoice.taxType === 'IGST' && (
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">IGST ({invoice.taxRate || 18}%)</span>
                <span className="font-mono font-semibold text-gray-900">
                  {formatINR(invoice.taxAmount || 0)}
                </span>
              </div>
            )}

            {isCgstSgst && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium">CGST ({halfTaxRate}%)</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {formatINR(halfTaxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium">SGST ({halfTaxRate}%)</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {formatINR(halfTaxAmount)}
                  </span>
                </div>
              </>
            )}

            {/* Total Row */}
            <div className="flex justify-between pt-2 border-t border-gray-300 text-sm font-bold text-gray-950">
              <span>Total</span>
              <span className="font-mono">₹{formatINR(invoice.totalAmount || 0)}</span>
            </div>
          </div>

          {/* Balance Due Highlight */}
          <div className="p-2.5 bg-gray-100 rounded flex justify-between items-center text-sm font-extrabold text-gray-950 border border-gray-300">
            <span>Balance Due</span>
            <span className="font-mono text-base">
              ₹{formatINR(invoice.balanceDue ?? invoice.totalAmount ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Section */}
      {invoice.termsAndConditions && (
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <span className="font-bold text-gray-700 block mb-1 uppercase tracking-wider text-[10px]">
            Terms & Conditions
          </span>
          <p className="whitespace-pre-line leading-relaxed">{invoice.termsAndConditions}</p>
        </div>
      )}
    </div>
  );
};
