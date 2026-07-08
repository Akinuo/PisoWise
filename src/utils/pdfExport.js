// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPeso } from './formatters';

const GOLD  = [245, 183, 49];
const NAVY  = [8, 14, 31];
const MUTED = [110, 118, 140];

/**
 * Generates a monthly financial report PDF: summary stats, category
 * breakdown, and a full transaction table. Entirely client-side — no
 * server round-trip, works the same whether or not the Groq proxy is set up.
 */
export const generateMonthlyReportPdf = ({ monthLabel, transactions, getCatLabel }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PisoWise', 14, 15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ulat Pinansyal — ${monthLabel}`, 14, 24);

  // ── Summary ──
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net      = income - expenses;

  let y = 44;
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Buod', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryRows = [
    ['Kabuuang Kita', formatPeso(income, 2)],
    ['Kabuuang Gastos', formatPeso(expenses, 2)],
    [net >= 0 ? 'Natitirang Balanse' : 'Kulang', formatPeso(Math.abs(net), 2)],
    ['Bilang ng Transaksyon', String(transactions.length)],
  ];
  summaryRows.forEach(([label, value]) => {
    doc.setTextColor(...MUTED);
    doc.text(label, 14, y);
    doc.setTextColor(...NAVY);
    doc.text(value, 90, y);
    y += 7;
  });

  // ── Category breakdown ──
  y += 6;
  const byCategory = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const categoryRows = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [getCatLabel(cat), formatPeso(amt, 2), `${expenses > 0 ? Math.round((amt / expenses) * 100) : 0}%`]);

  if (categoryRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Kategorya', 'Halaga', '%']],
      body: categoryRows,
      theme: 'plain',
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Transaction list ──
  const txRows = transactions
    .slice()
    .sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return db - da;
    })
    .map(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return [
        d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        t.type === 'income' ? 'Kita' : 'Gastos',
        getCatLabel(t.category),
        t.description || '-',
        formatPeso(t.amount, 2),
      ];
    });

  if (txRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Petsa', 'Uri', 'Kategorya', 'Paglalarawan', 'Halaga']],
      body: txRows,
      theme: 'striped',
      headStyles: { fillColor: GOLD, textColor: NAVY, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Ginawa gamit ang PisoWise — ${new Date().toLocaleDateString('en-PH')}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`pisowise-ulat-${stamp}.pdf`);
};
