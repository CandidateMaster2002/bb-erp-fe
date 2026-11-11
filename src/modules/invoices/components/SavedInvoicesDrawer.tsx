import React from 'react';
import { useInvoices, useDeleteInvoice } from '../api/invoicesApi';
import type { InvoiceData } from '../types';
import { X, Trash2, FileText, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { formatINR } from './InvoiceTemplate';

interface SavedInvoicesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (invoice: InvoiceData) => void;
}

export const SavedInvoicesDrawer: React.FC<SavedInvoicesDrawerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { data: invoices, isLoading, error } = useInvoices();
  const deleteMutation = useDeleteInvoice();

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved invoice?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                Saved Invoices
              </h3>
              <p className="text-xs text-gray-500">
                {invoices?.length || 0} invoices recorded in database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">Loading saved invoices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-xs text-red-500">
              Failed to load invoices. Please check your connection.
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
              No saved invoices yet. Create an invoice and tap &quot;Save to Database&quot;.
            </div>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => {
                  onSelect(inv);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-zinc-800/80 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition cursor-pointer group shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 font-medium">
                        {inv.status || 'SAVED'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">
                      {inv.clientCompany || inv.clientName || 'Unnamed Client'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-white block">
                      ₹{formatINR(inv.totalAmount || 0)}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {inv.invoiceDate || 'No date'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                  <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Load into Editor <ArrowRight className="w-3 h-3" />
                  </span>
                  {inv.id && (
                    <button
                      onClick={(e) => handleDelete(e, inv.id!)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
