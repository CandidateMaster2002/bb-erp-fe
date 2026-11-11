import html2pdf from 'html2pdf.js';
import type { InvoiceData } from '../types';

export async function exportToPdf(invoice: InvoiceData, elementId = 'invoice-printable-template'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice element not found');
  }

  const filename = `${invoice.invoiceNumber || 'Invoice'}.pdf`;

  const opt = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.99 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      windowWidth: element.scrollWidth,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
  };

  await (html2pdf() as any).set(opt).from(element).save();
}

export function printInvoice(): void {
  window.print();
}
