import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';
import type { InvoiceData } from '../types';
import { formatINR } from '../components/InvoiceTemplate';

export async function exportToDocx(invoice: InvoiceData): Promise<void> {
  const isCgstSgst = invoice.taxType === 'CGST_SGST';
  const halfTaxRate = (invoice.taxRate || 0) / 2;
  const halfTaxAmount = (invoice.taxAmount || 0) / 2;

  const tableBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const cellBorderLight = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  // Header Table (Biller details Left, Tax Invoice & Balance Due Right)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Left cell: Biller
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: invoice.billerCompany || invoice.billerName || 'YOUR COMPANY NAME',
                    bold: true,
                    size: 28, // 14pt
                  }),
                ],
              }),
              ...(invoice.billerName && invoice.billerCompany !== invoice.billerName
                ? [new Paragraph({ children: [new TextRun({ text: invoice.billerName, size: 20, color: '64748B' })] })]
                : []),
              new Paragraph({
                children: [new TextRun({ text: invoice.billerAddress || '', size: 18, color: '475569' })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: [invoice.billerCity, invoice.billerState, invoice.billerPincode]
                      .filter(Boolean)
                      .join(', '),
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: invoice.billerCountry || 'India', size: 18, color: '475569' })],
              }),
              ...(invoice.billerGstin
                ? [new Paragraph({ children: [new TextRun({ text: `GSTIN: ${invoice.billerGstin}`, bold: true, size: 18 })] })]
                : []),
            ],
          }),
          // Right cell: TAX INVOICE
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'TAX INVOICE',
                    bold: true,
                    size: 32, // 16pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `# ${invoice.invoiceNumber || 'INV-000001'}`,
                    bold: true,
                    size: 22,
                    color: '334155',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Balance Due',
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `₹${formatINR(invoice.balanceDue ?? invoice.totalAmount ?? 0)}`,
                    bold: true,
                    size: 26,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Client & Dates Table
  const clientAndDatesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Client details
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'BILL TO',
                    bold: true,
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: invoice.clientCompany || invoice.clientName || 'CLIENT NAME',
                    bold: true,
                    size: 22,
                    color: '1E3A8A',
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: invoice.clientAddress || '', size: 18, color: '475569' })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: [invoice.clientCity, invoice.clientState, invoice.clientPincode]
                      .filter(Boolean)
                      .join(', '),
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              ...(invoice.clientGstin
                ? [new Paragraph({ children: [new TextRun({ text: `GSTIN: ${invoice.clientGstin}`, bold: true, size: 18 })] })]
                : []),
              ...(invoice.placeOfSupply
                ? [new Paragraph({ children: [new TextRun({ text: `Place of Supply: ${invoice.placeOfSupply}`, size: 18 })] })]
                : []),
            ],
          }),
          // Dates
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Invoice Date : ', color: '64748B', size: 18 }),
                  new TextRun({ text: invoice.invoiceDate || '-', bold: true, size: 18 }),
                ],
              }),
              ...(invoice.terms
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: 'Terms : ', color: '64748B', size: 18 }),
                        new TextRun({ text: invoice.terms, bold: true, size: 18 }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Due Date : ', color: '64748B', size: 18 }),
                  new TextRun({ text: invoice.dueDate || '-', bold: true, size: 18 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Items Table
  const itemsHeaderRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })],
        shading: { fill: '232323' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Item & Description' })],
        shading: { fill: '232323' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'HSN/SAC' })],
        shading: { fill: '232323' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Qty', alignment: AlignmentType.RIGHT })],
        shading: { fill: '232323' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Rate', alignment: AlignmentType.RIGHT })],
        shading: { fill: '232323' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Amount', alignment: AlignmentType.RIGHT })],
        shading: { fill: '232323' },
      }),
    ],
  });

  const itemRows = (invoice.items || []).map((item, idx) => {
    const itemAmount = (item.quantity || 0) * (item.rate || 0);
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: String(idx + 1), alignment: AlignmentType.CENTER })],
          borders: cellBorderLight,
        }),
        new TableCell({
          children: [new Paragraph({ text: item.description || '-' })],
          borders: cellBorderLight,
        }),
        new TableCell({
          children: [new Paragraph({ text: item.hsnSac || '-' })],
          borders: cellBorderLight,
        }),
        new TableCell({
          children: [new Paragraph({ text: Number(item.quantity || 0).toFixed(2), alignment: AlignmentType.RIGHT })],
          borders: cellBorderLight,
        }),
        new TableCell({
          children: [new Paragraph({ text: formatINR(item.rate || 0), alignment: AlignmentType.RIGHT })],
          borders: cellBorderLight,
        }),
        new TableCell({
          children: [new Paragraph({ text: formatINR(itemAmount), alignment: AlignmentType.RIGHT })],
          borders: cellBorderLight,
        }),
      ],
    });
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [itemsHeaderRow, ...itemRows],
  });

  // Summary Table (Total in words & bank details left, amounts right)
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Left: Words & Bank
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Total In Words:', bold: true, size: 18 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: invoice.totalInWords || '', italics: true, size: 18 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: invoice.notes || 'Thanks for your business.', italics: true, size: 18, color: '64748B' })],
              }),
              ...(invoice.bankName || invoice.accountNumber
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: 'BANK DETAILS', bold: true, size: 18, color: '334155' })],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Account Holder: ${invoice.accountHolderName || ''}\n`, size: 18 }),
                        new TextRun({ text: `Bank Name: ${invoice.bankName || ''}\n`, size: 18 }),
                        new TextRun({ text: `Account Number: ${invoice.accountNumber || ''}\n`, bold: true, size: 18 }),
                        new TextRun({ text: `IFSC Code: ${invoice.ifscCode || ''}\n`, size: 18 }),
                        ...(invoice.upiId ? [new TextRun({ text: `UPI ID: ${invoice.upiId}`, size: 18 })] : []),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          // Right: Subtotal, Tax, Total
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Sub Total: ', size: 18 }),
                  new TextRun({ text: formatINR(invoice.subtotal || 0), bold: true, size: 18 }),
                ],
              }),
              ...(invoice.taxType === 'IGST'
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `IGST (${invoice.taxRate || 18}%): `, size: 18 }),
                        new TextRun({ text: formatINR(invoice.taxAmount || 0), bold: true, size: 18 }),
                      ],
                    }),
                  ]
                : []),
              ...(isCgstSgst
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `CGST (${halfTaxRate}%): `, size: 18 }),
                        new TextRun({ text: formatINR(halfTaxAmount), bold: true, size: 18 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `SGST (${halfTaxRate}%): `, size: 18 }),
                        new TextRun({ text: formatINR(halfTaxAmount), bold: true, size: 18 }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Total: ', bold: true, size: 22 }),
                  new TextRun({ text: `₹${formatINR(invoice.totalAmount || 0)}`, bold: true, size: 22 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Balance Due: ', bold: true, size: 22 }),
                  new TextRun({
                    text: `₹${formatINR(invoice.balanceDue ?? invoice.totalAmount ?? 0)}`,
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          headerTable,
          new Paragraph({ text: '' }),
          clientAndDatesTable,
          new Paragraph({ text: '' }),
          itemsTable,
          new Paragraph({ text: '' }),
          summaryTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoiceNumber || 'Invoice'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
