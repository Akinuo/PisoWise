// src/services/groq.js
// Uses Groq's OpenAI-compatible API with Llama 3.3 70B Versatile

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_CONTEXT = `You are PisoWise AI — a warm, expert financial coach specifically for low-income Filipino families.
Your role: Help Filipinos manage their piso wisely, save for dreams, and break free from debt.

Key guidelines:
- Always use Philippine Peso (₱) for amounts
- Reference Filipino context: sari-sari store profits, OFW remittances, paluwagan, utang sa tindahan, 13th month pay, SSS, PhilHealth, Pag-IBIG
- Speak in a friendly, encouraging tone — like a trusted kuya/ate giving money advice
- Use simple Filipino-friendly language (can mix a bit of Taglish when it feels natural)
- Consider common Filipino income sources: daily wage, online jobs, small business, farming, driving for hire
- Always give practical, actionable advice for tight budgets
- Reference the 50-30-20 rule adapted for Filipino context (necessities-savings-wants)
- Mention government programs when relevant: 4Ps, TUPAD, CAMP, Pag-IBIG loans
- Format responses clearly with bullet points and peso amounts
- Be empathetic — many families struggle and need encouragement, not judgment`;

/**
 * Core API call to Groq.
 *
 * Prefers a server-side proxy (VITE_GROQ_PROXY_URL) if one is configured —
 * see /api/groq.js. This keeps the real API key off the client entirely.
 * Falls back to calling Groq directly from the browser (VITE_GROQ_API_KEY)
 * if no proxy is set up, which is what happens out of the box. That's fine
 * to develop with, but means the key is visible in the shipped JS bundle —
 * deploy the proxy before this app is handling real traffic.
 */
const callGroq = async (messages, maxTokens = 1024) => {
  const proxyUrl = import.meta.env.VITE_GROQ_PROXY_URL;
  const fullMessages = [{ role: 'system', content: SYSTEM_CONTEXT }, ...messages];

  if (proxyUrl) {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: fullMessages, max_tokens: maxTokens }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Groq proxy error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  }

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Neither VITE_GROQ_PROXY_URL nor VITE_GROQ_API_KEY is configured.');

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages:    fullMessages,
      max_tokens:  maxTokens,
      temperature: 0.7,
      top_p:       0.9,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
};

// ─── Personalized Budget Generator ───────────────────────────────────────
export const generateBudget = async ({ monthlyIncome, expenses, familySize, goals }) => {
  const prompt = `Generate a detailed monthly budget plan for a Filipino family with:
- Monthly Income: ₱${monthlyIncome.toLocaleString()}
- Family Size: ${familySize} members
- Current Monthly Expenses: ${JSON.stringify(expenses)}
- Financial Goals: ${goals || 'Save and reduce debt'}

Provide:
1. Recommended budget allocation per category (with ₱ amounts)
2. Specific savings target
3. Areas to cut spending
4. One practical money-saving tip from Filipino culture
5. Expected progress in 3 months

Keep it realistic for a Filipino family income level.`;

  return callGroq([{ role: 'user', content: prompt }], 1200);
};

// ─── Savings Strategy ────────────────────────────────────────────────────
export const generateSavingsStrategy = async ({ goalName, targetAmount, currentSavings, monthlyIncome, monthlyExpenses }) => {
  const available = monthlyIncome - monthlyExpenses;
  const prompt = `Create a practical savings strategy for a Filipino family:
- Savings Goal: ${goalName}
- Target Amount: ₱${targetAmount.toLocaleString()}
- Currently Saved: ₱${currentSavings.toLocaleString()}
- Amount Remaining: ₱${(targetAmount - currentSavings).toLocaleString()}
- Monthly Income: ₱${monthlyIncome.toLocaleString()}
- Monthly Expenses: ₱${monthlyExpenses.toLocaleString()}
- Available for Savings: ₱${available.toLocaleString()}/month

Provide:
1. How many months to reach the goal
2. Weekly savings target
3. Three creative ways to save more (Filipino context)
4. What to do if money runs short (emergency plan)
5. Milestone rewards to stay motivated`;

  return callGroq([{ role: 'user', content: prompt }], 1000);
};

// ─── Debt Repayment Plan ────────────────────────────────────────────────
export const generateDebtPlan = async ({ debts, monthlyIncome, monthlyExpenses }) => {
  const debtSummary = debts.map(d =>
    `• ${d.creditorName}: ₱${d.remainingAmount.toLocaleString()} remaining (${d.interestRate || 0}% interest)`
  ).join('\n');

  const prompt = `Create a debt repayment plan for a Filipino family:
Monthly Income: ₱${monthlyIncome.toLocaleString()}
Monthly Expenses: ₱${monthlyExpenses.toLocaleString()}
Available for Debt: ₱${(monthlyIncome - monthlyExpenses).toLocaleString()}/month

Debts:
${debtSummary}

Provide:
1. Recommended repayment order (avalanche or snowball method — explain which fits best)
2. How much to pay per debt monthly
3. Expected debt-free date
4. Tips to avoid new debt (Filipino context: saying no to utang)
5. What to do with freed-up money after a debt is paid off`;

  return callGroq([{ role: 'user', content: prompt }], 1000);
};

// ─── Emergency Fund Advice ───────────────────────────────────────────────
export const generateEmergencyFundAdvice = async ({ monthlyExpenses, currentSavings, familySize }) => {
  const target = monthlyExpenses * 3;
  const prompt = `Give emergency fund advice for a Filipino family of ${familySize}:
- Monthly Expenses: ₱${monthlyExpenses.toLocaleString()}
- Recommended Emergency Fund (3 months): ₱${target.toLocaleString()}
- Current Savings: ₱${currentSavings.toLocaleString()}
- Gap to Fill: ₱${Math.max(0, target - currentSavings).toLocaleString()}

Explain:
1. Why an emergency fund matters (use relatable Filipino scenarios: typhoons, medical emergencies, job loss)
2. Where to keep emergency funds in the Philippines (CIMB, Maya, GCash GSave, Pag-IBIG MP2)
3. Step-by-step plan to build it from scratch
4. What counts as a real emergency
5. How to rebuild after using it`;

  return callGroq([{ role: 'user', content: prompt }], 900);
};

// ─── Weekly Spending Insights ────────────────────────────────────────────
export const generateWeeklyInsights = async ({ transactions, monthlyBudget, monthlyIncome }) => {
  const weekTotal   = transactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
  const incomeTotal = transactions.reduce((sum, t) => t.type === 'income'  ? sum + t.amount : sum, 0);

  const categories = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const prompt = `Analyze this Filipino family's weekly finances and give insights:
Weekly Expenses: ₱${weekTotal.toLocaleString()}
Weekly Income: ₱${incomeTotal.toLocaleString()}
Net: ₱${(incomeTotal - weekTotal).toLocaleString()}
Monthly Budget: ₱${monthlyBudget?.toLocaleString() || 'Not set'}
Monthly Income: ₱${monthlyIncome?.toLocaleString() || 'Not set'}${monthlyIncome ? ` (this week's expenses are ${((weekTotal / monthlyIncome) * 100).toFixed(0)}% of monthly income)` : ''}
Spending by Category: ${JSON.stringify(categories)}

Provide:
1. Overall financial health assessment (2-3 sentences, encouraging)
2. Top spending category analysis — is it too high?
3. One specific thing they did well this week
4. One specific thing to improve next week
5. Quick money tip for the coming week
Keep it under 300 words, conversational, like a trusted financial friend.`;

  return callGroq([{ role: 'user', content: prompt }], 600);
};

// ─── Financial Coaching Chat ─────────────────────────────────────────────
export const chatWithCoach = async (conversationHistory, userMessage, userContext) => {
  const contextNote = userContext
    ? `\n[User context: Monthly income ₱${userContext.monthlyIncome?.toLocaleString() || 'unknown'}, has ${userContext.savingsCount || 0} savings goals, ${userContext.debtCount || 0} active debts]`
    : '';

  const messages = [
    ...conversationHistory.slice(-8), // Keep last 8 messages for context window efficiency
    {
      role: 'user',
      content: userMessage + contextNote,
    },
  ];

  return callGroq(messages, 800);
};

// ─── Financial Health Score Explanation ─────────────────────────────────
export const explainHealthScore = async ({ score, income, expenses, savings, debts }) => {
  const prompt = `A Filipino family has a Financial Health Score of ${score}/100.
Income: ₱${income.toLocaleString()}/month
Expenses: ₱${expenses.toLocaleString()}/month
Total Savings: ₱${savings.toLocaleString()}
Total Debt: ₱${debts.toLocaleString()}

Explain in 3-4 sentences:
1. What the score means for them
2. The main reason it's at this level
3. The single most impactful action to improve it this month`;

  return callGroq([{ role: 'user', content: prompt }], 400);
};

// ─── Lesson Q&A ─────────────────────────────────────────────────────────
export const answerFinancialQuestion = async (question, lessonTopic) => {
  const prompt = `A Filipino learning about "${lessonTopic}" asks: "${question}"

Answer in a beginner-friendly way using simple language and Filipino examples.
Use specific peso amounts when helpful.
Keep the answer under 200 words.`;

  return callGroq([{ role: 'user', content: prompt }], 500);
};

// ─── Receipt Photo → Structured Data (Vision) ───────────────────────────
//
// Uses a vision-capable Groq model to read a receipt photo and extract the
// total amount, a short description, and a best-guess category. This is a
// separate path from callGroq() — vision requests need a different model
// and a multimodal message shape (image + text in one content array), and
// skip the financial-coach system prompt since it's not relevant here.
//
// Model name last verified against Groq's available models as of this
// code's writing — if extraction starts failing outright, check
// console.groq.com for the current vision-capable model name and update
// VISION_MODEL below (and the ALLOWED_MODELS list in api/groq.js if the
// proxy is deployed).
const VISION_MODEL = 'llama-3.2-90b-vision-preview';

export const extractReceiptData = async (imageBase64, categoryOptions) => {
  const categoryList = categoryOptions.join(', ');
  const promptText = `You're reading a receipt photo from a Filipino store or restaurant. Extract:
1. "amount" — the TOTAL amount paid, as a plain number (no currency symbol, no commas)
2. "description" — the store/merchant name, short (max 40 chars)
3. "category" — pick the single best match from this exact list: ${categoryList}

Respond with ONLY a JSON object, no other text, no markdown fences:
{"amount": 000.00, "description": "...", "category": "..."}

If you can't read a total amount clearly, set "amount" to 0. If unsure of category, use "other".`;

  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: imageBase64 } },
    ],
  }];

  const proxyUrl = import.meta.env.VITE_GROQ_PROXY_URL;
  let raw;

  if (proxyUrl) {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 300, model: VISION_MODEL }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Groq proxy error: ${response.status}`);
    }
    const data = await response.json();
    raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  } else {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('Neither VITE_GROQ_PROXY_URL nor VITE_GROQ_API_KEY is configured.');

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: VISION_MODEL, messages, max_tokens: 300, temperature: 0.2 }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API error: ${response.status}`);
    }
    const data = await response.json();
    raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  }

  // Strip markdown code fences if the model added them despite instructions.
  const cleaned = raw.replace(/```json|```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Hindi na-parse ang resulta ng pagbasa ng resibo.');
  }

  const amount = Number(parsed.amount) || 0;
  return {
    amount,
    description: String(parsed.description || '').slice(0, 40),
    category: categoryOptions.includes(parsed.category) ? parsed.category : 'other',
  };
};

export default { generateBudget, generateSavingsStrategy, generateDebtPlan, generateEmergencyFundAdvice, generateWeeklyInsights, chatWithCoach, explainHealthScore, answerFinancialQuestion, extractReceiptData };
