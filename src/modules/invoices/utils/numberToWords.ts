const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';

  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    str += tens[Math.floor(num / 10)];
    if (num % 10 > 0) {
      str += '-' + ones[num % 10];
    }
    str += ' ';
  } else if (num > 0) {
    str += ones[num] + ' ';
  }

  return str.trim();
}

/**
 * Converts a numeric amount to Indian Rupee Words format:
 * e.g. 20532 -> "Indian Rupee Twenty Thousand Five Hundred Thirty-Two Only"
 */
export function numberToIndianRupees(amount: number): string {
  if (amount == null || isNaN(amount) || amount === 0) {
    return 'Indian Rupee Zero Only';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let result = '';

  const crores = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;

  const lakhs = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousands = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundreds = rem;

  if (crores > 0) {
    result += convertLessThanThousand(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    result += convertLessThanThousand(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    result += convertLessThanThousand(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    result += convertLessThanThousand(hundreds) + ' ';
  }

  result = result.replace(/\s+/g, ' ').trim();

  let formatted = 'Indian Rupee ' + (result.length > 0 ? result : 'Zero');

  if (paise > 0) {
    formatted += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  formatted += ' Only';

  return isNegative ? 'Minus ' + formatted : formatted;
}
