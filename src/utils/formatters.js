/**
 * Pemformat mata uang Rupiah seragam: Rp185.000 (titik pemisah ribuan, tanpa desimal).
 */
export function formatRupiah(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return 'Rp0';
  const abs = Math.round(Math.abs(num));
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  return num < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

/**
 * Pemformat angka ribuan Indonesia tanpa simbol mata uang.
 */
export function formatNumber(amount, maximumFractionDigits = 0) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits,
  }).format(num);
}

/**
 * Memformat angka/string menjadi teks input bertitik pemisah ribuan (contoh: 385000 -> "385.000").
 * Bila allowDecimal = true, pecahan desimal ditampilkan memakai koma (contoh: 2.5 -> "2,5").
 */
export function formatThousandInput(value, allowDecimal = false) {
  if (value === '' || value === null || value === undefined) return '';

  const addThousandDots = (digitsStr) => {
    if (!digitsStr) return '';
    const cleaned = digitsStr.replace(/^0+(?=\d)/, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

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

  if (allowDecimal) {
    let intPart = '';
    let decPart = '';
    let hasDecimal = false;

    if (raw.includes(',')) {
      const parts = raw.split(',');
      intPart = parts[0].replace(/\D/g, '');
      decPart = parts.slice(1).join('').replace(/\D/g, '');
      hasDecimal = true;
    } else if (/^\d+\.\d*$/.test(raw)) {
      const dotCount = (raw.match(/\./g) || []).length;
      if (dotCount === 1) {
        const [i, d] = raw.split('.');
        // Angka desimal format JS seperti "2.5" atau "1250.75"
        intPart = i.replace(/\D/g, '');
        decPart = d.replace(/\D/g, '');
        hasDecimal = true;
      } else {
        intPart = raw.replace(/\D/g, '');
      }
    } else {
      intPart = raw.replace(/\D/g, '');
    }

    if (!intPart && !hasDecimal) return '';
    const formattedInt = intPart ? addThousandDots(intPart) : '0';
    return hasDecimal ? `${formattedInt},${decPart}` : formattedInt;
  }

  const digits = raw.replace(/\D/g, '');
  return addThousandDots(digits);
}

/**
 * Mengurai string input bertitik ribuan kembali ke string angka standar JS (contoh: "385.000" -> "385000", "1.250,5" -> "1250.5").
 */
export function parseThousandInput(rawValue, allowDecimal = false) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
  const raw = String(rawValue);

  if (!allowDecimal) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/^0+(?=\d)/, '');
  }

  if (raw.includes(',')) {
    const parts = raw.split(',');
    const intDigits = parts[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const decDigits = parts.slice(1).join('').replace(/\D/g, '');
    if (!intDigits && !decDigits) return '';
    return `${intDigits || '0'}.${decDigits}`;
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/^0+(?=\d)/, '');
}

/**
 * Pemformat persentase dengan tanda + opsional.
 */
export function formatPercent(value, showPlus = false) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  const rounded = num.toFixed(1).replace('.', ',');
  return showPlus && num > 0 ? `+${rounded}%` : `${rounded}%`;
}

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
];

/**
 * Pemformat tanggal Indonesia: 14 November 2026
 */
export function formatTanggalId(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const month = BULAN_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Pemformat tanggal ringkas DD/MM/YYYY untuk form/tabel kasir
 */
export function formatTanggalShort(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
