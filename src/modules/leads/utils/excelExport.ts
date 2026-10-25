import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Lead } from '../types';

export const exportLeadsToExcel = (leads: Lead[], recordType: 'LEAD' | 'COLLABORATOR' = 'LEAD') => {
  if (!leads || leads.length === 0) return;

  const formattedRows = leads.map((l) => ({
    'ID': l.id,
    'Full Name': l.fullName || '',
    'Company': l.company || '',
    'Job Title': l.jobTitle || '',
    'Mobile Number': l.mobileNumber || '',
    'Personal Email': l.personalEmail || '',
    'LinkedIn URL': l.linkedinUrl || '',
    'City': l.city || '',
    'State': l.state || '',
    'Country': l.country || '',
    'Location': l.location || '',
    'Tags': Array.isArray(l.tags) 
      ? l.tags.map(t => typeof t === 'string' ? t : t.name).join(', ') 
      : '',
    'Categories': Array.isArray(l.categories)
      ? l.categories.map(c => c.name).join(', ')
      : '',
    'Priority': l.priority || '',
    'Next Follow-up': l.nextFollowUpDate ? format(new Date(l.nextFollowUpDate), 'yyyy-MM-dd') : '',
    'Last Contacted': l.lastContactedDate ? format(new Date(l.lastContactedDate), 'yyyy-MM-dd') : '',
    'Remarks / Notes': l.remark || '',
    'Created At': l.createdAt ? format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm') : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Auto-fit column widths
  const colKeys = Object.keys(formattedRows[0] || {});
  worksheet['!cols'] = colKeys.map((key) => {
    let maxLen = key.length;
    for (const row of formattedRows) {
      const val = (row as Record<string, any>)[key];
      if (val) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 2, 12), 45) };
  });

  const workbook = XLSX.utils.book_new();
  const sheetName = recordType === 'COLLABORATOR' ? 'Collaborators' : 'Leads';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
  });

  const fileName = `${recordType.toLowerCase()}s_filtered_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', fileName);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
