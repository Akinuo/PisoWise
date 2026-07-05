// src/pages/Insights.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { getTransactions, saveInsight, getInsights } from '../services/firebase';
import { generateWeeklyInsights, chatWithCoach, explainHealthScore } from '../services/groq';
import { calculateHealthScore, getHealthScoreInfo, formatPeso, formatDate, getCurrentMonthYear } from '../utils/formatters';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  HiSparkles, HiArrowPath, HiPaperAirplane,
  HiChatBubbleLeftRight, HiChartBar,
  HiLightBulb, HiClock,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

// ── Chat Message Bubble ────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isAI = msg.role === 'assistant';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isAI ? 'items-start' : 'items-end flex-row-reverse'}`}>
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pw-gold to-pw-amber flex items-center justify-center flex-shrink-0 mt-1">
          <HiSparkles className="w-3.5 h-3.5 text-pw-navy" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isAI
          ? 'bg-pw-mid border border-white/06 text-white/90 rounded-tl-sm'
          : 'text-pw-navy font-medium rounded-br-sm'
      }`}
        style={!isAI ? { background: 'linear-gradient(135deg,#F7C13A,#F59E0B)' } : {}}>
        {msg.content}
        {msg.timestamp && (
          <p className={`text-[10px] mt-1.5 ${isAI ? 'text-pw-muted' : 'text-pw-navy/60'}`}>
            {formatDate(msg.timestamp, 'time')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Insights() {
  const { user, profile } = useAuth();
  const { transactions, setTransactions, transactionsLoaded, insights, setInsights, addInsightLocal, savings, debts, chatHistory, addChatMessage, clearChatHistory, getMonthlyStats, getTotalSavings, getTotalDebt } = useStore((s) => ({ transactions: s.transactions, setTransactions: s.setTransactions, transactionsLoaded: s.transactionsLoaded, insights: s.insights, setInsights: s.setInsights, addInsightLocal: s.addInsightLocal, savings: s.savings, debts: s.debts, chatHistory: s.chatHistory, addChatMessage: s.addChatMessage, clearChatHistory: s.clearChatHistory, getMonthlyStats: s.getMonthlyStats, getTotalSavings: s.getTotalSavings, getTotalDebt: s.getTotalDebt, }), shallow);

  const [tab,         setTab]         = useState('insights'); // 'insights' | 'chat'
  const [genLoading,  setGenLoading]  = useState(false);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [healthExp,   setHealthExp]   = useState('');
  const [healthLoading, setHealthLoading] = useState(false);
  const chatEndRef = useRef(null);

  const { month, year } = getCurrentMonthYear();
  const stats       = getMonthlyStats(year, month);
  const totalSavings = getTotalSavings();
  const totalDebt   = getTotalDebt();
  const monthlyIncome = profile?.monthlyIncome || stats.income || 0;

  const healthScore = calculateHealthScore({
    monthlyIncome, monthlyExpenses: stats.expenses,
    totalSavings, totalDebt, savingsGoals: savings, debts,
  });
  const scoreInfo = getHealthScoreInfo(healthScore);

  // Fetch once per user session — see Dashboard.jsx for why deps stay [user] only.
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (!transactionsLoaded) setTransactions(await getTransactions(user.uid, 60));
      const ins = await getInsights(user.uid, 5);
      setInsights(ins);
    };
    load().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ── Generate Weekly Insights ─────────────────────────────────────────────
  const generateInsight = async () => {
    setGenLoading(true);
    try {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const weekTxs = transactions.filter(t => {
        const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return d >= weekAgo;
      });
      const result = await generateWeeklyInsights({
        transactions:   weekTxs,
        monthlyIncome,
      });
      const ref = await saveInsight(user.uid, result, 'weekly');
      addInsightLocal({ id: ref.id, content: result, type: 'weekly', generatedAt: { toDate: () => new Date() } });
      toast.success('AI Insight na-generate! 🤖');
    } catch (e) { toast.error(e.message || 'Hindi nagawa. Subukan ulit.'); }
    finally { setGenLoading(false); }
  };

  // ── Health Score Explanation ──────────────────────────────────────────────
  const explainScore = async () => {
    setHealthLoading(true); setHealthExp('');
    try {
      const result = await explainHealthScore({
        score:    healthScore,
        income:   monthlyIncome,
        expenses: stats.expenses,
        savings:  totalSavings,
        debts:    totalDebt,
      });
      setHealthExp(result);
    } catch (e) { toast.error(e.message); }
    finally { setHealthLoading(false); }
  };

  // ── AI Chat ───────────────────────────────────────────────────────────────
  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');

    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    addChatMessage(userMsg);
    setChatLoading(true);

    try {
      const ctx = {
        monthlyIncome,
        savingsCount: savings.length,
        debtCount:    debts.length,
      };
      const history = chatHistory.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithCoach(history, msg, ctx);
      addChatMessage({ role: 'assistant', content: response, timestamp: new Date() });
    } catch (e) {
      addChatMessage({ role: 'assistant', content: 'Pasensya na, nagkaroon ng error. Subukan ulit.', timestamp: new Date() });
    } finally { setChatLoading(false); }
  };

  const QUICK_PROMPTS = [
    'Paano makatipid ng ₱1,000 sa isang buwan?',
    'Dapat bang mag-invest na ako?',
    'Paano babayaran ang utang nang mas mabilis?',
    'Ano ang emergency fund at bakit kailangan?',
  ];

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">
          {/* Header */}
          <div className="pt-2">
            <h1 className="font-display text-2xl font-bold text-white mb-1">AI Insights</h1>
            <p className="text-pw-muted text-sm">Personalized na payo mula sa AI para sa inyong sitwasyon</p>
          </div>

          {/* Tab Switcher */}
          <div className="glass-sm p-1 flex gap-1">
            {[
              { id: 'insights', label: 'Mga Insight', icon: HiChartBar },
              { id: 'chat',     label: 'AI Coach',    icon: HiChatBubbleLeftRight },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  tab === id ? 'bg-pw-gold text-pw-navy' : 'text-pw-muted hover:text-white'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* ── INSIGHTS TAB ── */}
          <AnimatePresence mode="wait">
            {tab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Health Score Card */}
                <div className="glass p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 flex-shrink-0">
                      <CircularProgressbar value={healthScore} text={`${healthScore}`}
                        styles={buildStyles({
                          textSize:       '28px',
                          textColor:      scoreInfo.color,
                          pathColor:      scoreInfo.color,
                          trailColor:     'rgba(255,255,255,0.06)',
                          pathTransitionDuration: 1.2,
                        })} />
                    </div>
                    <div className="flex-1">
                      <p className="text-pw-muted text-xs mb-1">Financial Health Score</p>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-display text-2xl font-bold text-white">{healthScore}/100</p>
                        <span className="text-xl">{scoreInfo.emoji}</span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
                      <p className="text-pw-muted text-xs mt-1 leading-relaxed">{scoreInfo.desc}</p>
                    </div>
                  </div>
                  <button onClick={explainScore} disabled={healthLoading}
                    className="btn-secondary w-full mt-4 py-2 text-xs gap-2">
                    <HiLightBulb className="w-3.5 h-3.5 text-pw-gold" />
                    {healthLoading ? 'Nag-aanalisa...' : 'Ipaliwanag ng AI'}
                  </button>
                  <AnimatePresence>
                    {(healthExp || healthLoading) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                        {healthLoading && !healthExp ? (
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-3.5 rounded-lg" />)}
                          </div>
                        ) : (
                          <p className="text-white/80 text-sm leading-relaxed bg-pw-mid rounded-2xl p-3">{healthExp}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Monthly Summary */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Kita ngayong Buwan', value: formatPeso(stats.income, 0), color: '#10B981' },
                    { label: 'Gastos ngayong Buwan', value: formatPeso(stats.expenses, 0), color: '#F43F5E' },
                    { label: 'Netong Kita', value: formatPeso(stats.net, 0), color: stats.net >= 0 ? '#10B981' : '#F43F5E' },
                    { label: 'Kabuuang Ipon', value: formatPeso(totalSavings, 0), color: '#F7C13A' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="glass-sm p-3">
                      <p className="text-xs text-pw-muted mb-1">{label}</p>
                      <p className="font-bold text-base peso-amount" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Generate Insight */}
                <div className="glass p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HiSparkles className="w-4 h-4 text-pw-gold" />
                      <p className="text-sm font-semibold text-white">Weekly AI Insight</p>
                    </div>
                    <button onClick={generateInsight} disabled={genLoading}
                      className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                      <HiArrowPath className={`w-3.5 h-3.5 ${genLoading ? 'animate-spin' : ''}`} />
                      {genLoading ? 'Ginagawa...' : 'Generate'}
                    </button>
                  </div>
                  {genLoading && insights.length === 0 && (
                    <div className="space-y-2.5 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`shimmer h-3.5 rounded-lg ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Insights History */}
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <motion.div key={insight.id || i}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <div className="glass p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-pw-gold-dim flex items-center justify-center">
                              <HiSparkles className="w-3.5 h-3.5 text-pw-gold" />
                            </div>
                            <span className="label-gold text-[10px]">AI Analysis</span>
                          </div>
                          {insight.generatedAt && (
                            <div className="flex items-center gap-1 text-pw-muted">
                              <HiClock className="w-3 h-3" />
                              <p className="text-[10px]">
                                {formatDate(insight.generatedAt?.toDate ? insight.generatedAt.toDate() : new Date(), 'relative')}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{insight.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {insights.length === 0 && !genLoading && (
                    <div className="glass p-8 text-center">
                      <HiChartBar className="w-10 h-10 text-pw-muted mx-auto mb-3" />
                      <p className="text-white font-semibold mb-1">Walang AI insights pa</p>
                      <p className="text-pw-muted text-sm mb-4">I-generate ang iyong unang weekly analysis.</p>
                      <button onClick={generateInsight} disabled={genLoading} className="btn-primary px-6">
                        <HiSparkles className="w-4 h-4" /> Generate Insights
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── CHAT TAB ── */}
            {tab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Chat area */}
                <div className="glass rounded-3xl overflow-hidden flex flex-col"
                  style={{ minHeight: '400px', maxHeight: '55dvh' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/06">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pw-gold to-pw-amber flex items-center justify-center">
                        <HiSparkles className="w-3.5 h-3.5 text-pw-navy" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">PisoWise AI Coach</p>
                        <p className="text-pw-emerald text-[10px]">● Online · Llama 3.3 70B</p>
                      </div>
                    </div>
                    {chatHistory.length > 0 && (
                      <button onClick={clearChatHistory}
                        className="text-[10px] text-pw-muted hover:text-pw-rose px-2 py-1 rounded-lg hover:bg-pw-rose-dim transition-all">
                        Burahin
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-hidden">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pw-gold to-pw-amber flex items-center justify-center mx-auto mb-3">
                          <HiSparkles className="w-7 h-7 text-pw-navy" />
                        </div>
                        <p className="text-white font-semibold text-sm mb-1">Kamusta! Ako si PisoWise AI</p>
                        <p className="text-pw-muted text-xs leading-relaxed max-w-[220px] mx-auto">
                          Nandito ako para tumulong sa inyong mga katanungan tungkol sa pera at pananalapi.
                        </p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
                    {chatLoading && (
                      <div className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pw-gold to-pw-amber flex items-center justify-center flex-shrink-0">
                          <HiSparkles className="w-3.5 h-3.5 text-pw-navy" />
                        </div>
                        <div className="bg-pw-mid border border-white/06 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                          {[0,1,2].map(i => (
                            <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full bg-pw-muted" />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-3 py-3 border-t border-white/06">
                    <div className="flex gap-2">
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                        placeholder="Magtanong sa AI Coach..."
                        className="input-glass flex-1 text-sm py-2.5" />
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: chatInput.trim() ? 'linear-gradient(135deg,#F7C13A,#F59E0B)' : 'rgba(255,255,255,0.06)' }}>
                        <HiPaperAirplane className={`w-4 h-4 ${chatInput.trim() ? 'text-pw-navy' : 'text-pw-muted'}`} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Quick prompts */}
                {chatHistory.length === 0 && (
                  <div>
                    <p className="text-xs text-pw-muted mb-2 font-medium">Mga Madalas na Tanong</p>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <motion.button key={prompt} whileTap={{ scale: 0.98 }}
                          onClick={() => { setChatInput(prompt); }}
                          className="glass-sm p-3 text-left text-xs text-white/80 hover:text-white hover:border-pw-gold/20 transition-all">
                          <HiChatBubbleLeftRight className="inline w-3.5 h-3.5 mr-2 text-pw-gold" />
                          {prompt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
