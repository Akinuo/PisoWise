// src/utils/payoffCalculator.js
//
// Simulates paying off multiple debts month-by-month under two common
// strategies:
//   - Snowball:  pay off the SMALLEST balance first (momentum/motivation)
//   - Avalanche: pay off the HIGHEST interest rate first (saves the most money)
//
// Each month: interest accrues on every debt, minimum payments are applied
// to all debts, then any extra payment cascades to the highest-priority
// debt in the chosen order. Once a debt is paid off, its minimum payment
// amount rolls into the extra payment pool for future months (the classic
// "snowball" effect, which applies to both strategies once a debt clears).

const MAX_MONTHS = 600; // 50-year safety cap so a bad input can't infinite-loop

const simulate = (debts, extraPayment, strategy) => {
  let working = debts
    .filter(d => (d.remainingAmount || 0) > 0)
    .map(d => ({
      name:       d.creditorName,
      balance:    d.remainingAmount,
      rate:       (d.interestRate || 0) / 100, // monthly %, as a decimal
      // Fallback minimum if the user never set one, so the simulation
      // doesn't stall on a debt that would otherwise never get paid down.
      minPayment: d.monthlyPayment > 0 ? d.monthlyPayment : Math.max(d.remainingAmount * 0.02, 200),
    }));

  if (working.length === 0) {
    return { order: [], monthsToPayoff: 0, totalInterestPaid: 0, payoffMonths: {}, impossible: false };
  }

  const sortFn = strategy === 'avalanche'
    ? (a, b) => b.rate - a.rate
    : (a, b) => a.balance - b.balance;
  working.sort(sortFn);
  const priorityOrder = working.map(d => d.name);

  let month = 0;
  let totalInterest = 0;
  let extra = extraPayment;
  const payoffMonths = {};

  while (working.some(d => d.balance > 0.01) && month < MAX_MONTHS) {
    month++;

    // 1. Interest accrues on every remaining balance.
    working.forEach(d => {
      if (d.balance > 0) {
        const interest = d.balance * d.rate;
        totalInterest += interest;
        d.balance += interest;
      }
    });

    // 2. Minimum payments applied to every active debt.
    working.forEach(d => {
      if (d.balance > 0) d.balance -= Math.min(d.minPayment, d.balance);
    });

    // 3. Extra payment cascades to the highest-priority active debt(s).
    let pool = extra;
    for (const d of working) {
      if (pool <= 0) break;
      if (d.balance > 0) {
        const pay = Math.min(pool, d.balance);
        d.balance -= pay;
        pool -= pay;
      }
    }

    // 4. Record payoff month + roll freed-up minimums into future extra.
    let freedThisMonth = 0;
    working.forEach(d => {
      if (d.balance <= 0.01 && !(d.name in payoffMonths)) {
        payoffMonths[d.name] = month;
        freedThisMonth += d.minPayment;
      }
    });
    extra += freedThisMonth;
  }

  const impossible = working.some(d => d.balance > 0.01);

  return {
    order:             priorityOrder,
    monthsToPayoff:    impossible ? null : month,
    totalInterestPaid: Math.round(totalInterest),
    payoffMonths,
    impossible,
  };
};

/**
 * Compare snowball vs avalanche for a given set of debts + extra monthly payment.
 * Returns both simulations plus how much avalanche saves in interest (avalanche
 * always saves the same or more than snowball — it's mathematically optimal —
 * but snowball can be more motivating since small debts disappear faster).
 */
export const comparePayoffStrategies = (debts, extraPayment = 0) => {
  const snowball  = simulate(debts, extraPayment, 'snowball');
  const avalanche = simulate(debts, extraPayment, 'avalanche');
  const interestSaved = (snowball.impossible || avalanche.impossible)
    ? null
    : Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid);

  return { snowball, avalanche, interestSaved };
};
