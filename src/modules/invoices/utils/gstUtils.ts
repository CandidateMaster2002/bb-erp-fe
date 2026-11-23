export interface GstState {
  code: string;
  name: string;
}

export const GST_STATE_MAP: Record<string, GstState> = {
  '01': { code: '01', name: 'Jammu & Kashmir' },
  '02': { code: '02', name: 'Himachal Pradesh' },
  '03': { code: '03', name: 'Punjab' },
  '04': { code: '04', name: 'Chandigarh' },
  '05': { code: '05', name: 'Uttarakhand' },
  '06': { code: '06', name: 'Haryana' },
  '07': { code: '07', name: 'Delhi' },
  '08': { code: '08', name: 'Rajasthan' },
  '09': { code: '09', name: 'Uttar Pradesh' },
  '10': { code: '10', name: 'Bihar' },
  '11': { code: '11', name: 'Sikkim' },
  '12': { code: '12', name: 'Arunachal Pradesh' },
  '13': { code: '13', name: 'Nagaland' },
  '14': { code: '14', name: 'Manipur' },
  '15': { code: '15', name: 'Mizoram' },
  '16': { code: '16', name: 'Tripura' },
  '17': { code: '17', name: 'Meghalaya' },
  '18': { code: '18', name: 'Assam' },
  '19': { code: '19', name: 'West Bengal' },
  '20': { code: '20', name: 'Jharkhand' },
  '21': { code: '21', name: 'Odisha' },
  '22': { code: '22', name: 'Chhattisgarh' },
  '23': { code: '23', name: 'Madhya Pradesh' },
  '24': { code: '24', name: 'Gujarat' },
  '26': { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  '27': { code: '27', name: 'Maharashtra' },
  '29': { code: '29', name: 'Karnataka' },
  '30': { code: '30', name: 'Goa' },
  '31': { code: '31', name: 'Lakshadweep' },
  '32': { code: '32', name: 'Kerala' },
  '33': { code: '33', name: 'Tamil Nadu' },
  '34': { code: '34', name: 'Puducherry' },
  '35': { code: '35', name: 'Andaman & Nicobar Islands' },
  '36': { code: '36', name: 'Telangana' },
  '37': { code: '37', name: 'Andhra Pradesh' },
  '38': { code: '38', name: 'Ladakh' },
  '97': { code: '97', name: 'Other Territory' },
};

export const INDIAN_STATES: GstState[] = Object.values(GST_STATE_MAP);

export const SUPPLIER_STATE_CODE = '08';
export const SUPPLIER_STATE_NAME = 'Rajasthan';

/**
 * Extracts the 2-digit GST state code from a valid GSTIN
 */
export function getStateFromGstin(gstin?: string): GstState | null {
  if (!gstin) return null;
  const trimmed = gstin.trim().toUpperCase();
  if (trimmed.length < 2) return null;
  const code = trimmed.substring(0, 2);
  return GST_STATE_MAP[code] || null;
}

/**
 * Determines whether GST supply is Interstate (IGST) or Intrastate (CGST + SGST)
 * Default supplier is Rajasthan (State Code 08).
 */
export function determineTaxType(
  supplierStateCode: string = SUPPLIER_STATE_CODE,
  recipientStateOrPlaceOfSupply: string = ''
): 'IGST' | 'CGST_SGST' {
  if (!recipientStateOrPlaceOfSupply) return 'IGST';

  const cleaned = recipientStateOrPlaceOfSupply.trim().toLowerCase();

  // If matches Rajasthan or code 08
  if (
    cleaned === '08' ||
    cleaned.startsWith('08') ||
    cleaned.includes('(08)') ||
    cleaned.includes('rajasthan')
  ) {
    return 'CGST_SGST';
  }

  // Check if starts with supplier code
  if (supplierStateCode && cleaned.startsWith(supplierStateCode.toLowerCase())) {
    return 'CGST_SGST';
  }

  return 'IGST';
}

/**
 * Removes personal names (e.g. Shashi Kumar / Shashi Kumari) to comply with
 * sole proprietorship / business trade name identity requirements.
 */
export function sanitizeBusinessName(name?: string, fallback: string = 'AGARWAL CREATION'): string {
  if (!name) return fallback;
  const lower = name.trim().toLowerCase();
  if (lower.includes('shashi') || lower.includes('kumar') || lower.includes('kumari')) {
    return fallback;
  }
  return name.trim();
}
