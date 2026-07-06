// src/utils/dataBackup.js
//
// Exports everything the user has in PisoWise as a single downloadable JSON
// file — a genuine backup, not just a transactions export (see csvExport.js
// for that). Card numbers/CVV/expiry are never stored server-side to begin
// with (see firebase.js addCard/updateCard), so there's nothing sensitive
// to strip here beyond what's already excluded at write time.

export const exportFullBackup = ({ profile, transactions, savings, debts, cards, recurringTransactions, insights }) => {
  const backup = {
    exportedAt: new Date().toISOString(),
    app: 'PisoWise',
    version: 1,
    profile: profile ? {
      displayName: profile.displayName,
      monthlyIncome: profile.monthlyIncome,
    } : null,
    transactions,
    savings,
    debts,
    cards,
    recurringTransactions,
    insights,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pisowise-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
