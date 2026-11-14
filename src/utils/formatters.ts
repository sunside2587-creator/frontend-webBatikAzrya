const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function formatRupiah(amount: number | string | null | undefined): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return 'Rp0';
  const abs = Math.round(Math.abs(num));
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  return num < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function formatNumber(
  amount: number | string | null | undefined,
  maximumFractionDigits = 0
): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits,
  }).format(num);
}

function addThousandDots(digitsStr: string): string {
  if (!digitsStr) return '';
  const cleaned = digitsStr.replace(/^0+(?=\d)/, '');
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatThousandInput(
  value: number | string | null | undefined,
  allowDecimal = false
): string {
  if (value === '' || value === null || value === undefined) return '';

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    const absNum = Math.abs(value);
    if (!allowDecimal) {
      return addThousandDots(String(Math.round(absNum)));
    }
    const [intPart = '0', decPart] = String(absNum).split('.');
    const formattedInt = addThousandDots(intPart) || '0';
    return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
  }

  const raw = String(value).trim();
  if (!raw) return '';

  if (!allowDecimal) {
    return addThousandDots(raw.replace(/\D/g, ''));
  }

  let intPart = '';
  let decPart = '';
  let hasDecimal = false;

  if (raw.includes(',')) {
    const parts = raw.split(',');
    intPart = parts[0].replace(/\D/g, '');
    decPart = parts.slice(1).join('').replace(/\D/g, '');
    hasDecimal = true;
  } else if (/^\d+\.\d*$/.test(raw) && (raw.match(/\./g) || []).length === 1) {
    const [integerSegment, decimalSegment] = raw.split('.');
    intPart = integerSegment.replace(/\D/g, '');
    decPart = decimalSegment.replace(/\D/g, '');
    hasDecimal = true;
  } else {
    intPart = raw.replace(/\D/g, '');
  }

  if (!intPart && !hasDecimal) return '';
  const formattedInt = intPart ? addThousandDots(intPart) : '0';
  return hasDecimal ? `${formattedInt},${decPart}` : formattedInt;
}

export function parseThousandInput(
  rawValue: number | string | null | undefined,
  allowDecimal = false
): string {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
  const raw = String(rawValue);

  if (!allowDecimal) {
    const digits = raw.replace(/\D/g, '');
    return digits ? digits.replace(/^0+(?=\d)/, '') : '';
  }

  if (raw.includes(',')) {
    const parts = raw.split(',');
    const intDigits = parts[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const decDigits = parts.slice(1).join('').replace(/\D/g, '');
    if (!intDigits && !decDigits) return '';
    return `${intDigits || '0'}.${decDigits}`;
  }

  const digits = raw.replace(/\D/g, '');
  return digits ? digits.replace(/^0+(?=\d)/, '') : '';
}

export function formatPercent(value: number | string | null | undefined, showPlus = false): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  const rounded = num.toFixed(1).replace('.', ',');
  return showPlus && num > 0 ? `+${rounded}%` : `${rounded}%`;
}

export function formatTanggalId(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTanggalShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}
