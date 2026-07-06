// src/utils/csvExport.js

// Escape a single CSV field per RFC 4180 — wrap in quotes and double up any
// quotes inside, if the value contains a comma, quote, or newline.
const escapeCsvField = (value) => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsv = (rows) => rows.map(row => row.map(escapeCsvField).join(',')).join('\r\n');

const downloadBlob = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export transactions to a downloadable CSV file.
 * @param {Array} transactions - array of transaction objects
 * @param {Function} getCatLabel - (categoryId, type) => display label
 */
export const exportTransactionsToCsv = (transactions, getCatLabel) => {
  const header = ['Petsa', 'Uri', 'Kategorya', 'Paglalarawan', 'Halaga (PHP)', 'Note'];
  const rows = transactions
    .slice()
    .sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return db - da;
    })
    .map(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return [
        d.toISOString().slice(0, 10),
        t.type === 'income' ? 'Kita' : 'Gastos',
        getCatLabel(t.category, t.type),
        t.description || '',
        t.amount,
        t.note || '',
      ];
    });

  const csv = toCsv([header, ...rows]);
  // \uFEFF = UTF-8 BOM so Excel/Google Sheets render ₱ and special chars correctly
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob('\uFEFF' + csv, `pisowise-transactions-${stamp}.csv`, 'text/csv;charset=utf-8;');
};
