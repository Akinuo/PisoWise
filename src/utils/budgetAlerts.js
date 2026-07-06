// src/utils/budgetAlerts.js
//
// Category-level budget limits + alert checking. Kept separate from
// formatters.js since this is a distinct, self-contained concern.

/**
 * Given the current month's actual category spending mix and a target total
 * monthly expense figure, derive a per-category "limit" proportional to how
 * the user actually spends. This grounds the limit in real behavior instead
 * of an arbitrary guess, while still capping it to a healthier total (80% of
 * income, matching the 50-30-20 rule already referenced elsewhere in the app).
 *
 * Returns {} if there's no spending data yet to base a split on — alerts
 * simply won't fire until there's at least one month of category history.
 */
export const computeCategoryLimits = (expenseSummary, monthlyIncome) => {
  const totalExpenses = Object.values(expenseSummary).reduce((s, v) => s + v, 0);
  if (totalExpenses <= 0 || !monthlyIncome) return {};

  const targetTotal = monthlyIncome * 0.8;
  const limits = {};
  Object.entries(expenseSummary).forEach(([cat, amt]) => {
    limits[cat] = Math.round((amt / totalExpenses) * targetTotal);
  });
  return limits;
};

/**
 * Checks whether a category's current-month spending has crossed its limit.
 * Returns null if there's no limit set for that category (nothing to check
 * against) or spending is comfortably under it.
 */
export const checkCategoryAlert = (category, currentMonthSpent, categoryLimits) => {
  const limit = categoryLimits?.[category];
  if (!limit || limit <= 0) return null;

  const pct = currentMonthSpent / limit;
  if (pct >= 1) return { level: 'over', percent: Math.round(pct * 100), limit };
  if (pct >= 0.9) return { level: 'near', percent: Math.round(pct * 100), limit };
  return null;
};
