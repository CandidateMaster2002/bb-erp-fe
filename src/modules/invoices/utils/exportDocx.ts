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
  ImageRun,
} from 'docx';
import type { InvoiceData } from '../types';
import { formatINR } from '../components/InvoiceTemplate';
import { sanitizeBusinessName } from './gstUtils';
import { DEFAULT_SIGNATURE_DATA_URI } from '../assets/signatureDataUri';

export async function exportToDocx(invoice: InvoiceData): Promise<void> {
  const isCgstSgst = invoice.taxType === 'CGST_SGST';
  const halfTaxRate = Number(((invoice.taxRate || 0) / 2).toFixed(2));
  const halfTaxAmount = (invoice.taxAmount || 0) / 2;

  const sellerBusinessName = sanitizeBusinessName(
    invoice.billerCompany || invoice.billerName,
    'AGARWAL CREATION'
  );

  const bankAccountHolder = sanitizeBusinessName(
    invoice.accountHolderName,
    sellerBusinessName
  );

  let signatureImageRun: ImageRun | null = null;
  if (invoice.showSignature !== false) {
    try {
      const sigDataUri = invoice.signatureUrl || DEFAULT_SIGNATURE_DATA_URI;
      const base64Str = sigDataUri.includes(',') ? sigDataUri.split(',')[1] : sigDataUri;
      const binaryStr = atob(base64Str);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      signatureImageRun = new ImageRun({
        data: bytes,
        transformation: { width: 95, height: 60 },
        type: 'png',
      });
    } catch (e) {
      console.warn('Failed to attach signature image to docx', e);
    }
  }

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

  // Header Table (Seller details Left, Tax Invoice & Balance Due Right)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Left cell: Seller
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sellerBusinessName,
                    bold: true,
                    size: 28, // 14pt
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: invoice.billerAddress || '', size: 18, color: '475569' })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: [
                      invoice.billerCity,
                      invoice.billerState,
                      invoice.billerPincode ? `– ${invoice.billerPincode}` : '',
                    ]
                      .filter(Boolean)
                      .join(', '),
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `State: ${invoice.billerState || 'Rajasthan'} (${invoice.billerStateCode || '08'})`,
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              ...(invoice.billerGstin
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: `GSTIN: ${invoice.billerGstin}`, bold: true, size: 18 })],
                    }),
                  ]
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
                    text: `# ${invoice.invoiceNumber || 'INV-000602'}`,
                    bold: true,
                    size: 20,
                    color: '475569',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Balance Due: ₹${formatINR(invoice.balanceDue ?? invoice.totalAmount ?? 0)}`,
                    bold: true,
                    size: 24,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Bill To & Meta Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          // Bill To
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Bill To',
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
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: `GSTIN: ${invoice.clientGstin}`, bold: true, size: 18 })],
                    }),
                  ]
                : []),
              ...(invoice.placeOfSupply
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: `Place of Supply: ${invoice.placeOfSupply}`, size: 18 })],
                    }),
                  ]
                : []),
            ],
          }),
          // Dates & Meta
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
              ...(invoice.placeOfSupply
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: 'Place Of Supply : ', color: '64748B', size: 18 }),
                        new TextRun({ text: invoice.placeOfSupply, bold: true, size: 18 }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Reverse Charge : ', color: '64748B', size: 18 }),
                  new TextRun({ text: invoice.reverseCharge || 'No', bold: true, size: 18 }),
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
        shading: { fill: '1E293B' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Item & Description' })],
        shading: { fill: '1E293B' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'HSN/SAC' })],
        shading: { fill: '1E293B' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Qty', alignment: AlignmentType.RIGHT })],
        shading: { fill: '1E293B' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Rate (₹)', alignment: AlignmentType.RIGHT })],
        shading: { fill: '1E293B' },
      }),
      ...(invoice.taxType !== 'NONE'
        ? [
            new TableCell({
              children: [
                new Paragraph({
                  text: invoice.taxType === 'IGST' ? 'Tax (IGST)' : 'Tax (GST)',
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: { fill: '1E293B' },
            }),
          ]
        : []),
      new TableCell({
        children: [new Paragraph({ text: 'Amount (₹)', alignment: AlignmentType.RIGHT })],
        shading: { fill: '1E293B' },
      }),
    ],
  });

  const itemRows = (invoice.items || []).map((item, idx) => {
    const itemAmount = (item.quantity || 0) * (item.rate || 0);
    const itemTax = (itemAmount * (item.taxRate || invoice.taxRate || 0)) / 100;
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
        ...(invoice.taxType !== 'NONE'
          ? [
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${formatINR(itemTax)} (${item.taxRate || invoice.taxRate || 0}%)`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: cellBorderLight,
              }),
            ]
          : []),
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

  // Summary Table (Total in words & bank details left, amounts & signature right)
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
                children: [
                  new TextRun({
                    text: invoice.notes || 'Thanks for your business.',
                    italics: true,
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
              ...(invoice.bankName || invoice.accountNumber
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: 'BANK DETAILS', bold: true, size: 18, color: '334155' })],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Account Name: ${bankAccountHolder}\n`, bold: true, size: 18 }),
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
          // Right: Subtotal, Tax, Total, Signatory
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Sub Total: ', size: 18 }),
                  new TextRun({ text: `₹${formatINR(invoice.subtotal || 0)}`, bold: true, size: 18 }),
                ],
              }),
              ...(invoice.taxType === 'IGST'
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `IGST (${invoice.taxRate || 18}%): `, size: 18 }),
                        new TextRun({ text: `₹${formatINR(invoice.taxAmount || 0)}`, bold: true, size: 18 }),
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
                        new TextRun({ text: `₹${formatINR(halfTaxAmount)}`, bold: true, size: 18 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `SGST (${halfTaxRate}%): `, size: 18 }),
                        new TextRun({ text: `₹${formatINR(halfTaxAmount)}`, bold: true, size: 18 }),
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
              new Paragraph({ text: '' }), // Spacer
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `For ${sellerBusinessName}\n`, bold: true, size: 18 }),
                  ...(signatureImageRun
                    ? [signatureImageRun, new TextRun({ text: '\n' })]
                    : [new TextRun({ text: '\n\n' })]),
                  new TextRun({ text: 'Authorised Signatory', size: 18, color: '64748B' }),
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
          metaTable,
          new Paragraph({ text: '' }),
          itemsTable,
          new Paragraph({ text: '' }),
          summaryTable,
          ...(invoice.termsAndConditions
            ? [
                new Paragraph({ text: '' }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Terms & Conditions:', bold: true, size: 18 }),
                    new TextRun({ text: `\n${invoice.termsAndConditions}`, size: 16, color: '64748B' }),
                  ],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceNumber || 'Invoice'}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
