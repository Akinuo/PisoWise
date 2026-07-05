// src/pages/Lessons.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LESSONS } from '../utils/constants';
import { answerFinancialQuestion } from '../services/groq';
import {
  HiAcademicCap, HiChevronRight, HiChevronLeft,
  HiCheckCircle, HiXCircle, HiSparkles, HiArrowLeft,
  HiClock, HiStar, HiQuestionMarkCircle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

// ── Lesson Card (list view) ────────────────────────────────────────────────
function LessonCard({ lesson, completed, onClick }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={onClick}
      className="glass p-4 flex items-center gap-4 cursor-pointer hover:border-white/15 transition-all">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${lesson.color}18`, border: `1px solid ${lesson.color}30` }}>
        {lesson.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white font-semibold text-sm truncate">{lesson.title}</p>
          {completed && <HiCheckCircle className="w-4 h-4 text-pw-emerald flex-shrink-0" />}
        </div>
        <p className="text-pw-muted text-xs truncate">{lesson.description}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-pw-muted">
            <HiClock className="w-3 h-3" /> {lesson.duration}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: `${lesson.color}15`, color: lesson.color }}>
            {lesson.level}
          </span>
        </div>
      </div>
      <HiChevronRight className="w-4 h-4 text-pw-muted flex-shrink-0" />
    </motion.div>
  );
}

// ── Quiz Section ────────────────────────────────────────────────────────────
function LessonQuiz({ quiz, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [done, setDone]         = useState(false);
  const q = quiz[current];

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.answer;
    setTimeout(() => {
      const next = [...answers, { correct }];
      setAnswers(next);
      if (current + 1 < quiz.length) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setDone(true);
        const score = next.filter(a => a.correct).length;
        onComplete(score, next.length);
      }
    }, 1000);
  };

  const score = answers.filter(a => a.correct).length;

  if (done) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 text-center">
        <div className="text-5xl mb-3">{pct >= 75 ? '🌟' : pct >= 50 ? '👍' : '📖'}</div>
        <h3 className="font-display text-xl font-bold text-white mb-1">
          {pct >= 75 ? 'Mahusay!' : pct >= 50 ? 'Magaling!' : 'Subukan Ulit!'}
        </h3>
        <p className="text-pw-muted text-sm mb-3">
          {score}/{quiz.length} na tamang sagot ({pct}%)
        </p>
        {pct >= 75 && <p className="text-pw-emerald text-sm">✅ Lesson completed!</p>}
      </motion.div>
    );
  }

  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-pw-muted font-medium uppercase tracking-wide">
          <HiQuestionMarkCircle className="inline w-3.5 h-3.5 mr-1" />Tanong {current + 1}/{quiz.length}
        </p>
        <div className="flex gap-1">
          {quiz.map((_, i) => (
            <div key={i} className={`w-6 h-1.5 rounded-full transition-colors ${
              i < current ? 'bg-pw-emerald' : i === current ? 'bg-pw-gold' : 'bg-white/10'
            }`} />
          ))}
        </div>
      </div>
      <p className="text-white font-semibold text-sm leading-relaxed">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect  = i === q.answer;
          const showResult = selected !== null;
          return (
            <motion.button key={i} whileTap={{ scale: showResult ? 1 : 0.98 }}
              onClick={() => handleSelect(i)} disabled={selected !== null}
              className={`w-full p-3 rounded-2xl text-left text-sm transition-all border ${
                showResult && isCorrect  ? 'bg-pw-emerald-dim border-pw-emerald/40 text-pw-emerald' :
                showResult && isSelected ? 'bg-pw-rose-dim border-pw-rose/40 text-pw-rose' :
                isSelected              ? 'bg-pw-gold-dim border-pw-gold/40 text-pw-gold' :
                                          'bg-pw-subtle border-white/08 text-white hover:border-white/20'
              }`}>
              <div className="flex items-center gap-2">
                {showResult && isCorrect  && <HiCheckCircle className="w-4 h-4 flex-shrink-0" />}
                {showResult && isSelected && !isCorrect && <HiXCircle className="w-4 h-4 flex-shrink-0" />}
                {(!showResult || (!isCorrect && !isSelected)) && (
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                )}
                {opt}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Lessons Page ───────────────────────────────────────────────────────
export default function Lessons() {
  const navigate = useNavigate();
  const { id: lessonIdParam } = useParams();
  const [activeLessonId, setActiveLessonId] = useState(lessonIdParam || null);
  const [activeSection,  setActiveSection]  = useState(0);
  const [showQuiz,       setShowQuiz]       = useState(false);
  const [completed,      setCompleted]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('pw_completed_lessons') || '[]'); } catch { return []; }
  });
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer,   setAiAnswer]   = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);

  // Keep state in sync if the URL's :id changes (e.g. tapping a lesson link
  // while already on the Lessons page, or browser back/forward navigation).
  useEffect(() => {
    setActiveLessonId(lessonIdParam || null);
    setActiveSection(0);
    setShowQuiz(false);
  }, [lessonIdParam]);

  const lesson = LESSONS.find(l => l.id === activeLessonId);

  const handleComplete = (score, total) => {
    if (score / total >= 0.75) {
      const updated = [...new Set([...completed, activeLessonId])];
      setCompleted(updated);
      try { localStorage.setItem('pw_completed_lessons', JSON.stringify(updated)); } catch { /* localStorage unavailable — progress still updates in memory for this session */ }
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim() || !lesson) return;
    setAiLoading(true); setAiAnswer('');
    try {
      const answer = await answerFinancialQuestion(aiQuestion, lesson.titleEn);
      setAiAnswer(answer);
    } catch (e) { toast.error(e.message); }
    finally { setAiLoading(false); }
  };

  // Lesson Reader View
  if (activeLessonId && lesson) {
    const section = lesson.sections[activeSection];
    return (
      <div className="page">
        <div className="page-content">
          <div className="space-y-4">
            {/* Back */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => { navigate('/lessons'); setAiAnswer(''); }}
                className="w-9 h-9 rounded-2xl bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white transition-all">
                <HiArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs text-pw-muted">{lesson.icon} {lesson.titleEn}</p>
                <h1 className="font-display text-lg font-bold text-white">{lesson.title}</h1>
              </div>
            </div>

            {/* Section progress */}
            <div className="flex gap-1.5">
              {lesson.sections.map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                  i <= activeSection ? 'bg-pw-gold' : 'bg-white/10'
                }`} />
              ))}
            </div>

            {/* Section content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeSection}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="glass p-5">
                  <h2 className="font-display text-lg font-bold text-white mb-4"
                    style={{ color: lesson.color }}>{section.heading}</h2>
                  <div className="space-y-3">
                    {section.body.split('\n').filter(l => l.trim()).map((line, i) => {
                      if (line.startsWith('•') || line.startsWith('✅') || line.startsWith('❌') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.')) {
                        return <p key={i} className="text-white/85 text-sm leading-relaxed pl-2">{line}</p>;
                      }
                      if (line.startsWith('"')) {
                        return (
                          <div key={i} className="glass-gold p-3 rounded-2xl">
                            <p className="text-pw-gold text-sm italic font-medium">{line}</p>
                          </div>
                        );
                      }
                      return <p key={i} className="text-white/85 text-sm leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3">
              {activeSection > 0 && (
                <button onClick={() => setActiveSection(s => s - 1)}
                  className="btn-secondary flex-1 gap-2">
                  <HiChevronLeft className="w-4 h-4" /> Nakaraan
                </button>
              )}
              {activeSection < lesson.sections.length - 1 ? (
                <button onClick={() => setActiveSection(s => s + 1)}
                  className="btn-primary flex-1 gap-2">
                  Susunod <HiChevronRight className="w-4 h-4" />
                </button>
              ) : !showQuiz ? (
                <button onClick={() => setShowQuiz(true)}
                  className="btn-primary flex-1 gap-2">
                  <HiStar className="w-4 h-4" /> Sumasagot sa Quiz
                </button>
              ) : null}
            </div>

            {/* Quiz */}
            <AnimatePresence>
              {showQuiz && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <LessonQuiz quiz={lesson.quiz} onComplete={handleComplete} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Q&A */}
            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiSparkles className="w-4 h-4 text-pw-gold" />
                <p className="text-sm font-semibold text-white">Magtanong sa AI</p>
              </div>
              <div className="flex gap-2">
                <input type="text" value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askAI()}
                  placeholder={`Magtanong tungkol sa ${lesson.title}...`}
                  className="input-glass flex-1 text-sm" />
                <button onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}
                  className="btn-primary px-4 py-2 flex-shrink-0">
                  {aiLoading ? <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" /> : 'Tanong'}
                </button>
              </div>
              <AnimatePresence>
                {aiAnswer && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                    <p className="text-xs text-pw-gold mb-2">AI Answer:</p>
                    <p className="text-white/85 text-sm leading-relaxed">{aiAnswer}</p>
                  </motion.div>
                )}
                {aiLoading && !aiAnswer && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-3.5 rounded-lg" />)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lessons List View
  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-1">
              <HiAcademicCap className="w-5 h-5 text-pw-gold" />
              <h1 className="font-display text-2xl font-bold text-white">Mga Aralin</h1>
            </div>
            <p className="text-pw-muted text-sm">
              {completed.length}/{LESSONS.length} aralin na nakumpleto
            </p>
          </div>

          {/* Progress */}
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-pw-muted">Progreso sa Pag-aaral</p>
              <p className="text-xs font-bold text-pw-gold">{Math.round((completed.length / LESSONS.length) * 100)}%</p>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-fill bg-pw-gold"
                initial={{ width: 0 }}
                animate={{ width: `${(completed.length / LESSONS.length) * 100}%` }}
                transition={{ duration: 0.8 }} />
            </div>
          </div>

          {/* Lesson cards */}
          <div className="space-y-3">
            {LESSONS.map((lesson, i) => (
              <motion.div key={lesson.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <LessonCard lesson={lesson} completed={completed.includes(lesson.id)}
                  onClick={() => navigate(`/lessons/${lesson.id}`)} />
              </motion.div>
            ))}
          </div>

          <div className="glass-gold p-4 text-center">
            <p className="text-pw-gold font-semibold text-sm mb-1">💡 Tip ng Araw</p>
            <p className="text-white/80 text-xs leading-relaxed">
              &ldquo;Ang financial literacy ay ang pinakamahalagang bagay na maaari mong ibigay sa iyong pamilya — mas mahalaga pa sa pera.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
