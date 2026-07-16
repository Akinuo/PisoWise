// src/utils/constants.js

// ─── Expense Categories ───────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  { id: 'food',         label: 'Pagkain',         icon: '🍚', color: '#F59E0B' },
  { id: 'transport',    label: 'Transportasyon',   icon: '🚌', color: '#3B82F6' },
  { id: 'utilities',   label: 'Kuryente/Tubig',   icon: '💡', color: '#8B5CF6' },
  { id: 'rent',        label: 'Upa/Bahay',         icon: '🏠', color: '#EC4899' },
  { id: 'health',      label: 'Kalusugan',         icon: '💊', color: '#EF4444' },
  { id: 'education',   label: 'Edukasyon',         icon: '📚', color: '#10B981' },
  { id: 'clothing',    label: 'Damit',             icon: '👕', color: '#06B6D4' },
  { id: 'load',        label: 'Load/Internet',     icon: '📱', color: '#84CC16' },
  { id: 'debt',        label: 'Bayad-Utang',       icon: '💳', color: '#F43F5E' },
  { id: 'grocery',     label: 'Grocery',           icon: '🛒', color: '#F97316' },
  { id: 'sari_sari',   label: 'Sari-sari Store',   icon: '🏪', color: '#A78BFA' },
  { id: 'remittance',  label: 'Padala',            icon: '💸', color: '#2DD4BF' },
  { id: 'savings',     label: 'Ipon',              icon: '🐷', color: '#34D399' },
  { id: 'insurance',   label: 'Insurance/SSS',     icon: '🛡️',  color: '#60A5FA' },
  { id: 'personal',    label: 'Personal',          icon: '👤', color: '#9CA3AF' },
  { id: 'other',       label: 'Iba pa',            icon: '📦', color: '#6B7280' },
];

// ─── Income Categories ────────────────────────────────────────────────────
export const INCOME_CATEGORIES = [
  { id: 'salary',       label: 'Sweldo',            icon: '💼', color: '#10B981' },
  { id: 'business',    label: 'Negosyo',            icon: '🏪', color: '#F59E0B' },
  { id: 'remittance',  label: 'Padala/Remittance',  icon: '💸', color: '#3B82F6' },
  { id: 'freelance',   label: 'Freelance',          icon: '💻', color: '#8B5CF6' },
  { id: 'farming',     label: 'Hanapbuhay/Farm',    icon: '🌾', color: '#84CC16' },
  { id: '13th_month',  label: '13th Month Pay',     icon: '🎁', color: '#EC4899' },
  { id: 'bonus',       label: 'Bonus',              icon: '⭐', color: '#F97316' },
  { id: 'allowance',   label: 'Allowance',          icon: '📩', color: '#06B6D4' },
  { id: 'rental',      label: 'Rental Income',      icon: '🏘️', color: '#A78BFA' },
  { id: 'ofw',         label: 'OFW Remittance',     icon: '✈️', color: '#2DD4BF' },
  { id: 'government',  label: '4Ps / Ayuda',        icon: '🏛️', color: '#60A5FA' },
  { id: 'other',       label: 'Iba pa',             icon: '📦', color: '#6B7280' },
];

// ─── Category Lookup Helpers ────────────────────────────────────────────
// Shared by any page/component that needs to resolve a category id back to
// its display info — avoids each file reimplementing the same lookup.
// Language-aware: reads the current language directly from the store
// (rather than requiring every caller to be a hook) so these plain
// functions still translate correctly. Re-renders happen naturally because
// every page also calls useTranslation() for its own UI text, which
// subscribes to language changes — see src/i18n/useTranslation.js.
import useStore from '../store/useStore';
import { TRANSLATIONS } from '../i18n/translations';

const translateCategoryLabel = (id, fallbackLabel, remittanceType) => {
  const language = useStore.getState().language;
  const dict = TRANSLATIONS[language] || TRANSLATIONS.fil;
  if (id === 'remittance' && remittanceType) {
    return dict.remittanceLabel?.[remittanceType] || fallbackLabel;
  }
  return dict.categories?.[id] || fallbackLabel;
};

export const getCategoryInfo = (id, type) => {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = cats.find(c => c.id === id) || { id: 'other', label: id, color: '#6B7280' };
  return { ...found, label: translateCategoryLabel(found.id, found.label, type) };
};

// For contexts where the transaction type isn't known/relevant up front
// (e.g. an export spanning both income and expense rows) — checks both
// lists rather than requiring the caller to know which one to search.
// Note: 'remittance' exists in both lists with different labels — this
// defaults to the expense phrasing since that's the far more common case
// (sending money), matching the previous behavior of this function.
export const getCategoryLabel = (id) => {
  const found = EXPENSE_CATEGORIES.find(c => c.id === id) || INCOME_CATEGORIES.find(c => c.id === id);
  if (!found) return id;
  return translateCategoryLabel(found.id, found.label, id === 'remittance' ? 'expense' : undefined);
};

// ─── Card Types ───────────────────────────────────────────────────────────
export const CARD_TYPES = [
  { id: 'visa',       label: 'Visa',        icon: '💳', color: '#1A1F71' },
  { id: 'mastercard', label: 'Mastercard',  icon: '💳', color: '#EB001B' },
  { id: 'gcash',      label: 'GCash',       icon: '📱', color: '#007DBA' },
  { id: 'maya',       label: 'Maya',        icon: '📱', color: '#00B0CA' },
  { id: 'bdo',        label: 'BDO',         icon: '🏦', color: '#00539B' },
  { id: 'bpi',        label: 'BPI',         icon: '🏦', color: '#C10016' },
  { id: 'metrobank',  label: 'Metrobank',   icon: '🏦', color: '#FFDD00' },
  { id: 'unionbank',  label: 'UnionBank',   icon: '🏦', color: '#EC2027' },
  { id: 'landbank',   label: 'Landbank',    icon: '🏦', color: '#006B3F' },
  { id: 'eastwest',   label: 'EastWest',    icon: '🏦', color: '#0057A8' },
  { id: 'cimb',       label: 'CIMB Bank',   icon: '🏦', color: '#CE2028' },
  { id: 'seabank',    label: 'SeaBank',     icon: '🏦', color: '#EE2E24' },
  { id: 'atm',        label: 'ATM Card',    icon: '💴', color: '#374151' },
  { id: 'other',      label: 'Iba pa',      icon: '💳', color: '#6B7280' },
];

// ─── Card Color Schemes ────────────────────────────────────────────────────
export const CARD_COLOR_SCHEMES = [
  { id: 'midnight',  label: 'Midnight Blue',    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',  textColor: '#ffffff' },
  { id: 'sunset',    label: 'Manila Sunset',    gradient: 'linear-gradient(135deg, #ce1126 0%, #f97316 100%)', textColor: '#ffffff' },
  { id: 'gold',      label: 'Philippine Gold',  gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)', textColor: '#ffffff' },
  { id: 'forest',    label: 'Emerald Forest',   gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', textColor: '#ffffff' },
  { id: 'ocean',     label: 'Pacific Ocean',    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #06b6d4 100%)', textColor: '#ffffff' },
  { id: 'galaxy',    label: 'Galaxy',           gradient: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)', textColor: '#ffffff' },
  { id: 'rose',      label: 'Rose Gold',        gradient: 'linear-gradient(135deg, #881337 0%, #fb7185 100%)', textColor: '#ffffff' },
  { id: 'slate',     label: 'Dark Slate',       gradient: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)', textColor: '#ffffff' },
  { id: 'tangerine', label: 'Tangerine',        gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)', textColor: '#ffffff' },
  { id: 'jade',      label: 'Jade',             gradient: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)', textColor: '#ffffff' },
];

// ─── Financial Literacy Lessons ────────────────────────────────────────────
export const LESSONS = [
  {
    id: 'budgeting_basics',
    title: 'Pagsasaayos ng Budget',
    titleEn: 'Budgeting Basics',
    description: 'Alamin kung paano hatiin ang sahod para sa pamilya.',
    icon: '📊',
    color: '#3B82F6',
    duration: '5 min',
    level: 'Baguhan',
    sections: [
      {
        heading: 'Ano ang Budget?',
        body: `Ang budget ay isang plano para sa iyong pera. Bago mo gastusin ang iyong kinikita, dapat malaman mo kung saan napupunta ang bawat piso.

Sa simpleng salita: Kung magkano ang pumasok, kailangan mong planuhin kung paano ito lalabas.`,
      },
      {
        heading: 'Ang 50-30-20 Rule para sa Pilipino',
        body: `Hatiin ang iyong sweldo sa tatlong bahagi:

• 50% → Pangunahing Pangangailangan (pagkain, upa, kuryente, tubig, transportasyon)
• 30% → Kagustuhan (libangan, damit, load, halo-halo)
• 20% → Ipon at Utang (savings, loan payments)

Halimbawa: Kung ₱15,000 ang sweldo:
• ₱7,500 → Pangangailangan
• ₱4,500 → Kagustuhan  
• ₱3,000 → Ipon at Utang`,
      },
      {
        heading: 'Paano Magsimula ng Budget',
        body: `Sundin ang mga hakbang na ito:

1. Isulat ang lahat ng kinikita mo (sweldo, negosyo, padala)
2. Ilista ang lahat ng kailangan mong bayaran (fixed expenses)
3. Alamin ang natitira para sa pagkain at iba pa
4. I-track ang bawat gastos gamit ang PisoWise app
5. Sa katapusan ng buwan, suriin kung tama ang gastusin

Tandaan: Hindi perpekto ang una. Unti-unting ayusin habang natututo ka.`,
      },
      {
        heading: 'Mga Maling Gawi sa Budget',
        body: `Iwasang gawin ang mga ito:

❌ Gastusin muna, mag-ipon ng natira — Mag-ipon muna bago gumastos!
❌ Wala sa papel ang plano — Isulat o i-record ang lahat
❌ Hindi kasama ang hindi regular na gastos — Isama ang school fees, medical, pamasko
❌ Mag-isa lang ang nagpaplano — Pag-usapan ng mag-asawa o pamilya`,
      },
    ],
    quiz: [
      { q: 'Sa 50-30-20 rule, magkano ang para sa ipon kung ₱20,000 ang sahod?', options: ['₱2,000', '₱4,000', '₱6,000', '₱10,000'], answer: 1 },
      { q: 'Ano ang unang dapat gawin sa pagpaplano ng budget?', options: ['Gastusin ang gusto', 'Ilista ang kinikita', 'Mag-ipon ng malaki', 'Mag-utang'], answer: 1 },
    ],
  },
  {
    id: 'savings_strategies',
    title: 'Paraan ng Pag-iipon',
    titleEn: 'Savings Strategies',
    description: 'Matuto kung paano mag-ipon kahit maliit ang kita.',
    icon: '🐷',
    color: '#10B981',
    duration: '6 min',
    level: 'Baguhan',
    sections: [
      {
        heading: 'Bakit Kailangan ng Ipon?',
        body: `Ang pag-iipon ay hindi para sa mayayaman lamang. Kahit ₱50 lang sa isang araw, malaking tulong ito:

• Para sa emergency (sakit, aksidente, bagyo)
• Para sa pangarap ng pamilya (paaralan ng anak, bagong bahay)
• Para sa hinaharap (pagtanda, pagretiro)

"Ang malaking ipon ay nagsisimula sa maliit na hakbang."`,
      },
      {
        heading: 'Mga Paraan ng Pag-iipon para sa Pilipino',
        body: `1. PALUWAGAN — Traditional Filipino savings circle. Bawat miyembro naglalagay ng fixed amount, at nag-iikot ang pondo. Libre at epektibo!

2. GSAVE (GCash) — Mag-ipon sa loob ng GCash na may interest. Libre at ligtas.

3. MAYA SAVINGS — Digital wallet savings na may mas mataas na interest kaysa karamihan ng bangko.

4. CIMB BANK — Mataas na interest rate, libre ang buksan online.

5. PAG-IBIG MP2 — Para sa mga miyembro, 7-9% interest per year. Safe dahil government-backed.

6. IPON CHALLENGE — 52-Week Challenge: Week 1 = ₱100, Week 2 = ₱200, at iba pa. Total = ₱137,800 sa isang taon!`,
      },
      {
        heading: 'Ang "Ipon Muna" Pamamaraan',
        body: `Ang pinakaepektibong paraan ng pag-iipon:

HINDI: Gastusin muna → Mag-ipon ng natira
TAMA: Mag-ipon muna → Gastusin ang natira

Paano:
1. Sa araw ng sweldo, ilipat AGAD ang ipon papunta sa hiwalay na account
2. Gawin itong automatic — para hindi mo na naisip pang gamitin
3. Simula sa kahit ₱200-₱500 lang per sweldo

"Bayaran mo muna ang iyong sarili."`,
      },
    ],
    quiz: [
      { q: 'Ano ang paluwagan?', options: ['Isang uri ng utang', 'Filipino savings circle', 'Bank account', 'Credit card'], answer: 1 },
      { q: 'Kailan dapat i-save ang pera?', options: ['Kapag may natira', 'Pagkatapos gastusin', 'Agad pagkatanggap ng sweldo', 'Sa katapusan ng buwan'], answer: 2 },
    ],
  },
  {
    id: 'debt_management',
    title: 'Pamamahala ng Utang',
    titleEn: 'Debt Management',
    description: 'Kung paano lumayo sa utang at kung paano ito bayaran.',
    icon: '⛓️',
    color: '#F43F5E',
    duration: '7 min',
    level: 'Intermediate',
    sections: [
      {
        heading: 'Mabuting Utang vs. Masamang Utang',
        body: `Hindi lahat ng utang ay masama. Mayroong pagkakaiba:

MABUTING UTANG:
✅ Educational loan (nagbibigay ng kaalaman at trabaho)
✅ Business loan (pang-palago ng negosyo)
✅ Housing loan (Pag-IBIG loan para sa sariling bahay)

MASAMANG UTANG:
❌ Credit card para sa luho
❌ 5-6 / bombay loan na may mataas na interest
❌ Utang para sa gambling o bisyo
❌ Utang sa sari-sari store para sa pagkain (sign ng mas malaking problema)`,
      },
      {
        heading: 'Paano Babayaran ang Utang',
        body: `Dalawang pamamaraan:

AVALANCHE METHOD (Para sa mataas na interest):
Bayaran muna ang utang na may pinakamataas na interest rate.
Mas nakakatipid ng pera sa katagalan.

SNOWBALL METHOD (Para sa motivasyon):
Bayaran muna ang pinakamaliit na utang.
Mas nakakapagbigay ng confidence para magpatuloy.

Para sa mga Pilipino na may 5-6 loan: PRIORITY ito! Ang 5-6 ay may 20% per month na interest — ito ang pinakamasama!`,
      },
      {
        heading: 'Paano Makakatakas sa 5-6 / Bombay',
        body: `Kung may 5-6 loan ka, narito ang emergency plan:

1. HUWAG KUMUHA NG BAGO — Kahit para bayaran ang dati
2. Pag-usapan sa pamilya — Kailangan ng tulong mula sa lahat
3. Hanapin ang alternatibong pondo:
   • Pag-IBIG loan (mas mababang interest)
   • Multipurpose Cooperative loan
   • SSS salary loan
4. Bayaran ang 5-6 gamit ang alternative loan
5. Mag-ipon para hindi na kailangang umutang muli

"Ang 5-6 ay trap — isang beses ka nito mahulmin, mahirap makawala."`,
      },
    ],
    quiz: [
      { q: 'Alin sa mga ito ang "masamang utang"?', options: ['Pag-IBIG housing loan', '5-6 loan para sa luho', 'Educational loan', 'Business loan'], answer: 1 },
      { q: 'Ang Avalanche method ay nagbabayad muna ng...', options: ['Pinakamaliit na utang', 'Pinakamataas na interest', 'Pinakamatandang utang', 'Pinakamalaking utang'], answer: 1 },
    ],
  },
  {
    id: 'emergency_fund',
    title: 'Emergency Fund',
    titleEn: 'Building Your Safety Net',
    description: 'Paano maghanda para sa hindi inaasahang gastos.',
    icon: '🛡️',
    color: '#F59E0B',
    duration: '5 min',
    level: 'Baguhan',
    sections: [
      {
        heading: 'Ano ang Emergency Fund?',
        body: `Ang emergency fund ay pera na nakalaan para sa mga hindi inaasahang sitwasyon:
• Pagkakasakit ng miyembro ng pamilya
• Aksidente o repair ng sasakyan
• Pagkawala ng trabaho
• Natural disasters (bagyo, baha, lindol)
• Hindi inaasahang gastos sa bahay

Hindi ito para sa:
❌ Sale sa mall
❌ Bagong gadget
❌ Vacation
❌ Regular na gastos`,
      },
      {
        heading: 'Magkano ang Kailangan?',
        body: `Ang standard na rekomendasyon: 3-6 buwan ng gastos.

Halimbawa:
• Monthly expenses: ₱12,000
• 3-month emergency fund target: ₱36,000
• 6-month target: ₱72,000

Para sa mga Pilipino na baguhan: Magsimula sa ₱5,000 lang — ito ay starter emergency fund. Mas mabuti kaysa wala.

Sundin ang mga hakbang:
1. ₱5,000 — Starter fund (1-3 buwan)
2. ₱20,000 — Basic fund (3-6 buwan)
3. 3-6x monthly expenses — Full fund`,
      },
      {
        heading: 'Saan Itago ang Emergency Fund?',
        body: `Dapat madali mong ma-access pero HINDI TOO EASY para ma-tempt kang gamitin:

PINAKAMAINAM:
• CIMB FastSave Account — mataas na interest, libre, ligtas
• Maya Savings — convenient at may interest
• GCash GSave — nakasave sa loob ng GCash

IWASAN:
❌ Cash sa bahay (madaling gamitin, pwedeng nanakaw)
❌ Regular checking account (too accessible)
❌ Stock market (hindi guaranteed, volatile)

"Ang emergency fund ay hindi investment — ito ay insurance."`,
      },
    ],
    quiz: [
      { q: 'Gaano karaming buwang gastos ang inirerekomendang emergency fund?', options: ['1 buwan', '3-6 buwan', '12 buwan', '2 taon'], answer: 1 },
      { q: 'Saan pinakamagaling itago ang emergency fund?', options: ['Cash sa bahay', 'Stock market', 'High-interest savings account', 'Pag-IBIG MP2'], answer: 2 },
    ],
  },
  {
    id: 'investing_basics',
    title: 'Pagsisimula ng Pag-invest',
    titleEn: 'Investing Basics',
    description: 'Palakaing palaguin ang pera para sa kinabukasan.',
    icon: '📈',
    color: '#8B5CF6',
    duration: '8 min',
    level: 'Intermediate',
    sections: [
      {
        heading: 'Bakit Mag-invest?',
        body: `Ang inflation (pagtaas ng presyo) ay nagpapababa ng halaga ng iyong pera sa paglipas ng panahon.

Halimbawa:
• ₱10,000 ngayon ≠ ₱10,000 after 10 years
• Kung 5% ang inflation, kailangan mong kumita ng 5%+ para lang mapanatili ang halaga

Ang pag-invest ay paraan para PALAGUIN ang pera kaysa hayaang mawalan ng halaga.`,
      },
      {
        heading: 'Mga Paraan ng Pag-invest para sa Pilipino',
        body: `PARA SA BAGUHAN (Low Risk):
• PAG-IBIG MP2 — Government-backed, 7-9% interest p.a., minimum ₱500
• Time Deposit sa bangko — Fixed rate, insured ng PDIC
• Treasury Bonds / RTBs — Government bonds, mababa ang risk

PARA SA INTERMEDIATE (Medium Risk):
• UITF (Unit Investment Trust Funds) — Para sa diversified portfolio
• Mutual Funds — Professionally managed
• ETF sa PSEi — Sa pamamagitan ng Seedbox, COL Financial, atbp.

PARA SA ADVANCED (High Risk/High Reward):
• Philippine Stock Market (PSEi) — Individual stocks
• Cryptocurrency — Highly volatile, mataas ang risk`,
      },
      {
        heading: 'Ang Golden Rule ng Pag-invest',
        body: `Sundin ang tamang ayos:

1. ✅ May emergency fund na ba? (3-6 months)
2. ✅ Bayad na ang high-interest debt?
3. ✅ May stable na kita?

KUNG OO: Pwede ka nang mag-invest!

KUNG HINDI: Ayusin muna ang mga ito bago mag-invest.

Simula sa PAG-IBIG MP2 — ligtas, government-backed, at may magandang returns para sa lahat ng Pilipino.

"Ang pinaka-importanteng araw sa pag-invest ay ang araw na magsimula ka — kahit maliit."`,
      },
    ],
    quiz: [
      { q: 'Ano ang PAG-IBIG MP2?', options: ['Isang uri ng utang', 'Government-backed investment program', 'Insurance', 'Credit card'], answer: 1 },
      { q: 'Ano ang unang dapat ayusin bago mag-invest?', options: ['Bumili ng stocks', 'Mag-ipon ng emergency fund', 'Kumuha ng credit card', 'Mag-invest sa crypto'], answer: 1 },
    ],
  },
  {
    id: 'ofw_money_management',
    title: 'Pera Management para sa OFW at Pamilya',
    titleEn: 'OFW Money Management',
    description: 'Paano pinakamahusay na gamitin ang padala para sa buong pamilya.',
    icon: '✈️',
    color: '#06B6D4',
    duration: '6 min',
    level: 'Baguhan',
    sections: [
      {
        heading: 'Ang Hamon ng Padala',
        body: `Milyun-milyong pamilyang Pilipino ang umaasa sa padala ng OFW. Pero ang malaking hamon: kadalasan, nauubos agad ang padala sa mga gastusin, walang natitirang ipon.

Ang totoo: Ang padala ay dapat gamitin hindi lang para sa araw-araw na gastos, kundi para rin sa hinaharap ng buong pamilya.`,
      },
      {
        heading: 'Ang 3-Sobre na Sistema',
        body: `Hatiin ang padala sa tatlong "sobre" (o bank accounts):

• SOBRE 1 — Pang-araw-araw (60-70%): pagkain, bills, eskwela ng mga bata
• SOBRE 2 — Ipon at Emergency Fund (15-20%): para sa sakit, aksidente, o kung matigil ang padala
• SOBRE 3 — Investment/Negosyo (15-20%): PAG-IBIG MP2, maliit na negosyo, o insurance

Ipaliwanag ito sa pamilyang tatanggap ng padala — dapat malinaw sa lahat kung paano ito gagamitin.`,
      },
      {
        heading: 'Mga Dapat Iwasan',
        body: `❌ 100% pang-gastusin ang buong padala — walang natitira kailanman
❌ Walang malinaw na "budget manager" sa pamilya — magulo ang paggamit
❌ Hindi kasama ang sarili ng OFW sa financial planning — dapat may say din
❌ Walang backup plan kung matigil ang trabaho o kontrata

✅ Gumamit ng app tulad ng PisoWise para ma-track ang padala at gastos, kahit malayo ang OFW.`,
      },
      {
        heading: 'Pag-invest Habang Nasa Ibang Bansa',
        body: `Bilang OFW, may mga espesyal na opsyon ka:

• Pag-IBIG MP2 — pwedeng mag-contribute kahit nasa abroad
• OFW Bank Accounts — may mga bangko na may espesyal na savings account para sa OFW na may mataas na interest
• SSS Flexi Fund — retirement savings program para sa OFW
• Direktang pag-invest gamit ang mobile apps (halimbawa: GCash, Maya investment features)

Simulan habang malakas pa ang trabaho — mas maaga, mas malaki ang tutubuin.`,
      },
    ],
    quiz: [
      { q: 'Sa 3-Sobre na Sistema, ilang porsyento ang para sa Ipon/Emergency Fund?', options: ['5-10%', '15-20%', '40-50%', '80-90%'], answer: 1 },
      { q: 'Ano ang Pag-IBIG MP2 na relevant sa OFW?', options: ['Uri ng utang', 'Pwede pa ring i-contribute kahit abroad', 'Para sa mga bata lang', 'Kailangan munang umuwi'], answer: 1 },
    ],
  },
  {
    id: 'insurance_sss_philhealth',
    title: 'Pag-unawa sa Insurance, SSS, at PhilHealth',
    titleEn: 'Insurance, SSS & PhilHealth Basics',
    description: 'Proteksyon para sa pamilya kung sakaling may mangyari.',
    icon: '🛡️',
    color: '#8B5CF6',
    duration: '6 min',
    level: 'Baguhan',
    sections: [
      {
        heading: 'Bakit Kailangan ng Proteksyon?',
        body: `Ang budgeting at savings ay mabuti, pero paano kung biglang magkasakit o mawalan ng trabaho? Dito papasok ang tinatawag na "proteksyon" — insurance at government programs.

Iniisip ng marami na "sayang lang ang pera sa insurance" — pero ang totoo, ito ang huling linya ng depensa laban sa malaking pinansyal na krisis.`,
      },
      {
        heading: 'SSS (Social Security System)',
        body: `Para sa mga nagtatrabaho sa private sector o self-employed:

• Sickness Benefit — cash benefit kung magkasakit ka at hindi makapasok
• Maternity Benefit — para sa mga buntis
• Disability at Retirement — pension kapag nag-retire o nagkaroon ng disability
• Death/Funeral Benefit — tulong sa pamilya kung mamatay ang miyembro

Dapat regular ang contribution para hindi maputol ang benefits.`,
      },
      {
        heading: 'PhilHealth',
        body: `Ang national health insurance ng Pilipinas — tumutulong sa gastusin sa ospital.

• Sakop nito ang confinement sa ospital, ilang klaseng operasyon, at outpatient services
• May "No Balance Billing" para sa mga indigent at senior citizens sa government hospitals
• Regular contribution = walang problema sa paggamit ng benefits kapag kinailangan

Tip: Laging dalhin ang PhilHealth ID/number kapag pumupunta sa ospital.`,
      },
      {
        heading: 'Life at Health Insurance (Private)',
        body: `Bukod sa SSS at PhilHealth, maaari ring mag-avail ng private insurance:

• Term Life Insurance — mas mura, nagbibigay ng malaking proteksyon sa pamilya kung may mangyari sa iyo
• Health/HMO cards — karagdagang proteksyon sa gastusing medikal
• Huwag paghaluin ang insurance at investment — mas malinaw at mas mura kung hiwalay ang dalawa

Simpleng tanong bago kumuha ng insurance: "Kung mawala ako bukas, paano mabubuhay ang aking pamilya?" Doon nagsisimula ang tamang proteksyon.`,
      },
    ],
    quiz: [
      { q: 'Alin ang tumutulong sa gastusin sa ospital?', options: ['SSS', 'PhilHealth', 'Pag-IBIG', 'BIR'], answer: 1 },
      { q: 'Ano ang benepisyo ng SSS kung magkasakit at hindi makapasok sa trabaho?', options: ['Retirement Benefit', 'Sickness Benefit', 'Maternity Benefit', 'Death Benefit'], answer: 1 },
    ],
  },
  {
    id: 'avoiding_scams',
    title: 'Pag-iwas sa Scam at Panloloko',
    titleEn: 'Avoiding Financial Scams',
    description: 'Kilalanin ang mga karaniwang panloloko at paano mag-ingat.',
    icon: '🚨',
    color: '#F43F5E',
    duration: '5 min',
    level: 'Baguhan',
    sections: [
      {
        heading: 'Bakit Kailangan Mag-ingat',
        body: `Ang mga scammer ay lalong nagiging kreatibo, lalo na sa social media at text messages. Kadalasan, target nila ang mga taong gustong dumami ang pera nang mabilis, o natatakot mawala ang kanilang pera/account.

Ang unang linya ng depensa: KAALAMAN. Kung alam mo ang mga pattern ng scam, mas mahirap kang biktimahin.`,
      },
      {
        heading: 'Mga Karaniwang Scam sa Pilipinas',
        body: `• Investment Scam / Ponzi — "Double your money in 30 days!" — kung sobrang ganda para maging totoo, hindi ito totoo
• Smishing (Text Scam) — "Nanalo ka ng GCash promo, i-click ang link" — huwag i-click ang mga hindi kilalang link
• Fake Bank/GCash Reps — tumatawag o nag-text na "verify" ang account, hihingi ng OTP — HUWAG KAILANMAN ibigay ang OTP kahit kanino
• Loan Scam — "instant approval" na loan apps na sobrang taas ng interest o humihingi ng advance fee bago pa lumabas ang pera`,
      },
      {
        heading: 'Mga Palatandaan ng Scam',
        body: `🚩 Sobrang bilis, walang risk, guaranteed na kita
🚩 May pressure na "ngayon na lang" o "limited time"
🚩 Hihingi ng personal info, OTP, o password
🚩 Kailangan mag-recruit pa ng iba para kumita (pyramid scheme)
🚩 Walang legit na SEC registration (pwedeng i-check sa SEC website)`,
      },
      {
        heading: 'Paano Protektahan ang Sarili',
        body: `1. HUWAG KAILANMAN ibahagi ang OTP, PIN, o password — kahit sino pa ang tumawag
2. I-verify muna sa opisyal na app o website bago maniwala sa anumang alok
3. Kung sobrang ganda para maging totoo, malamang scam ito
4. I-check ang SEC Advisory list (sec.gov.ph) bago mag-invest sa kahit anong "investment company"
5. Kausapin ang pamilya bago gumawa ng malaking desisyon sa pera

Tandaan: Walang legit na bangko o kumpanya ang hihingi ng OTP mo. Kung may humingi, 100% scam iyon.`,
      },
    ],
    quiz: [
      { q: 'Dapat mo bang ibigay ang OTP kung tumawag ang "bank representative"?', options: ['Oo, kung totoong bangko sila', 'Hindi, kailanman', 'Oo, kung may ID sila', 'Depende sa halaga'], answer: 1 },
      { q: 'Ano ang isang palatandaan ng investment scam?', options: ['May SEC registration', 'Guaranteed at napakabilis na kita', 'Mababang interest rate', 'Regular na financial report'], answer: 1 },
    ],
  },
];

// ─── Financial Health Score Thresholds ────────────────────────────────────
export const HEALTH_SCORE_RANGES = [
  { min: 80, label: 'Mahusay!',    color: '#10B981', emoji: '🌟', desc: 'Napakagaling ng iyong pamamahala ng pera!' },
  { min: 60, label: 'Maganda',     color: '#3B82F6', emoji: '👍', desc: 'Maayos ang iyong pinansyal na kalagayan.' },
  { min: 40, label: 'Pwede Pa',    color: '#F59E0B', emoji: '⚡', desc: 'May mga pagbabago na maaaring gawin.' },
  { min: 20, label: 'Kailangan ng Tulong', color: '#F97316', emoji: '⚠️', desc: 'Kailangan ng mga hakbang para mapabuti.' },
  { min: 0,  label: 'Kritiko',     color: '#EF4444', emoji: '🆘', desc: 'Kailangan ng agarang aksyon.' },
];

// ─── Months in Filipino ───────────────────────────────────────────────────
export const MONTHS_PH = [
  'Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo',
  'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre',
];

// ─── Day labels ───────────────────────────────────────────────────────────
export const DAYS_PH = ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'];

// ─── Savings Challenges ─────────────────────────────────────────────────
// Pre-built templates that pre-fill the "add savings goal" form with a
// suggested target, deadline, and note — a lightweight way to give people
// a concrete plan to follow instead of a blank goal with no structure.
export const SAVINGS_CHALLENGES = [
  {
    id: 'week52',
    emoji: '📅',
    name: '52-Week Challenge',
    description: 'Magsimula sa ₱50, dagdagan ng ₱50 bawat linggo',
    days: 364,
    targetAmount: 68900,
    note: '52-Week Savings Challenge: mag-ipon ng ₱50 sa Linggo 1, dagdagan ng ₱50 bawat linggo (₱100 sa Linggo 2, ₱150 sa Linggo 3, atbp.) hanggang ₱2,600 sa Linggo 52.',
  },
  {
    id: 'monthly1k',
    emoji: '🏦',
    name: '₱1,000 Bawat Buwan',
    description: 'Simpleng ipon, ₱1,000 kada buwan sa loob ng 1 taon',
    days: 365,
    targetAmount: 12000,
    note: 'Mag-ipon ng ₱1,000 bawat buwan sa loob ng 12 buwan. Pwedeng i-set as auto-debit o alarm reminder bawat sweldo.',
  },
  {
    id: 'nospend30',
    emoji: '🚫',
    name: '30-Day No-Spend',
    description: 'Iwasan ang di-kailangang gastos sa loob ng 30 araw',
    days: 30,
    targetAmount: 3000,
    note: '30-Day No-Spend Challenge: iwasan muna ang mga gastos na hindi kailangan (kape sa labas, food delivery, impulse buys) sa loob ng 30 araw. I-deposit dito ang matitipid.',
  },
  {
    id: 'daily20',
    emoji: '🪙',
    name: '₱20 Bawat Araw',
    description: 'Maliit na ipon araw-araw, malaki ang tipon sa taon',
    days: 365,
    targetAmount: 7300,
    note: 'Mag-ipon ng ₱20 bawat araw (halaga ng kape o meryenda) sa loob ng isang taon.',
  },
];

/**
 * Merges a challenge's base data (emoji/days/targetAmount — same regardless
 * of language) with its translated name/description/note.
 */
export const getChallengeInfo = (challenge) => {
  const language = useStore.getState().language;
  const dict = TRANSLATIONS[language]?.challenges?.[challenge.id] || TRANSLATIONS.fil.challenges[challenge.id];
  return { ...challenge, ...dict };
};
