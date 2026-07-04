// src/pages/Cards.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { addCard, getCards, updateCard, deleteCard } from '../services/firebase';
import { formatDate, maskCardNumber } from '../utils/formatters';
import { CARD_TYPES, CARD_COLOR_SCHEMES } from '../utils/constants';
import OTPModal from '../components/auth/OTPModal';
import { Timestamp } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiPlus, HiTrash, HiPencil, HiCreditCard, HiShieldCheck,
  HiEye, HiEyeSlash, HiLockClosed, HiLockOpen, HiStar,
  HiClipboardDocument, HiArrowsRightLeft, HiCheckCircle,
  HiPauseCircle, HiPlayCircle, HiWallet, HiXMark, HiChevronRight,
} from 'react-icons/hi2';

/* ── SVG icon map — replaces all emojis ──────────────────────────────────── */
function CardTypeIcon({ typeId, size = 20, color = '#ffffff' }) {
  const icons = {
    visa: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
        <path d="M7 12l2 3 1-2 1 2 2-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 9h2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 9h20" stroke={color} strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
    mastercard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
        <circle cx="9.5" cy="12" r="3.5" stroke={color} strokeWidth="1.5"/>
        <circle cx="14.5" cy="12" r="3.5" stroke={color} strokeWidth="1.5"/>
        <path d="M12 9.3a3.5 3.5 0 000 5.4" stroke={color} strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    gcash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5"/>
        <path d="M9 9h4a2 2 0 010 4H9v-4z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="16.5" r="1" fill={color}/>
        <path d="M9 6h6" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    maya: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5"/>
        <path d="M9 8l3 4 3-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 17h6" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    bdo: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-6 9 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={color} strokeWidth="1.5"/>
        <path d="M9 20V12h6v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12a3 3 0 000-6" stroke={color} strokeWidth="1.3" opacity="0.5"/>
      </svg>
    ),
    bpi: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-6 9 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={color} strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
        <path d="M12 9v2m0 4v2M9 12H7m10 0h-2" stroke={color} strokeWidth="1.3" opacity="0.6"/>
      </svg>
    ),
    atm: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke={color} strokeWidth="1.5"/>
        <path d="M7 9h10M7 12h4m0 0v3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M3 10h18" stroke={color} strokeWidth="1" opacity="0.3"/>
      </svg>
    ),
    other: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
        <path d="M6 9h12M6 12h6M6 15h4" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
        <path d="M2 9h20" stroke={color} strokeWidth="1" opacity="0.3"/>
      </svg>
    ),
  };
  return icons[typeId] || icons.other;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const cardTypeFor   = c => CARD_TYPES.find(t => t.id === c?.cardType) || CARD_TYPES.at(-1);
const schemeFor     = c => CARD_COLOR_SCHEMES.find(s => s.id === c?.colorScheme) || CARD_COLOR_SCHEMES[0];

/* ── StatusPill ────────────────────────────────────────────────────────────── */
function StatusPill({ children, tone = 'default', icon: Icon }) {
  const map = {
    default: 'border-white/10 bg-white/10 text-white/75',
    gold:    'border-pw-gold/25 bg-pw-gold-dim text-pw-gold',
    emerald: 'border-pw-emerald/25 bg-pw-emerald-dim text-pw-emerald',
    rose:    'border-pw-rose/25 bg-pw-rose-dim text-pw-rose',
    blue:    'border-pw-blue/25 bg-pw-blue-dim text-pw-blue-light',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${map[tone]}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

/* ── CardActionButton ──────────────────────────────────────────────────────── */
function CardActionButton({ icon: Icon, label, hint, onClick, active, danger, disabled }) {
  const base = 'group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border transition-all duration-200 cursor-pointer';
  const state = danger
    ? 'border-pw-rose/25 bg-pw-rose-dim text-pw-rose hover:border-pw-rose/45 hover:bg-pw-rose/18 active:scale-95'
    : active
    ? 'border-pw-gold/35 bg-pw-gold-dim text-pw-gold active:scale-95'
    : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/18 hover:text-white hover:bg-white/[0.07] active:scale-95';

  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={hint}
      className={`${base} ${state} disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100`}
      style={{ padding: '12px 8px 10px', minHeight: 68 }}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
        active ? 'bg-pw-gold/15' : danger ? 'bg-pw-rose/10' : 'bg-white/[0.06] group-hover:bg-white/[0.10]'
      }`}>
        <Icon className="w-4 h-4 transition-transform group-hover:scale-110 group-active:scale-95" />
      </div>
      <span className="text-[10px] font-semibold tracking-tight leading-none text-center px-0.5">{label}</span>
    </button>
  );
}

/* ── CreditCardVisual ─────────────────────────────────────────────────────── */
function CreditCardVisual({ card, flipped = false }) {
  const scheme = schemeFor(card);
  const type   = cardTypeFor(card);
  const status = card?.isFrozen
    ? { label: 'Paused',   tone: 'rose',    icon: HiLockClosed }
    : card?.isPrimary
    ? { label: 'Primary',  tone: 'gold',    icon: HiStar }
    : { label: 'Active',   tone: 'emerald', icon: HiCheckCircle };

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '1.586 / 1', perspective: '1200px' }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── Front ── */}
        <div
          className="card-shine absolute inset-0 overflow-hidden rounded-3xl text-white flex flex-col justify-between"
          style={{
            background: scheme.gradient,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.22)',
            backfaceVisibility: 'hidden',
            border: '1px solid rgba(255,255,255,0.14)',
            padding: '18px 20px 16px',
          }}
        >
          {/* Diagonal shine overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)' }} />
          {/* Subtle dot texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {/* ── Top row: brand + status ── */}
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/50 mb-0.5">PisoWise</p>
              <p className="text-[11px] font-semibold text-white/85">{type.label}</p>
            </div>
            <StatusPill tone={status.tone} icon={status.icon}>{status.label}</StatusPill>
          </div>

          {/* ── Middle row: chip + NFC ── */}
          <div className="relative z-10 flex items-center justify-between" style={{ marginTop: 2 }}>
            {/* EMV chip */}
            <div className="w-9 h-[26px] rounded-md overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #f6e27a 0%, #d4a832 35%, #f6e27a 65%, #c8961e 100%)',
                border: '1px solid rgba(180,120,0,0.35)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
              }}>
              <div className="w-full h-full"
                style={{
                  backgroundImage: 'linear-gradient(90deg, transparent 45%, rgba(120,80,0,0.22) 46% 54%, transparent 55%), repeating-linear-gradient(0deg, rgba(120,80,0,0.15) 0 1px, transparent 1px 5px)',
                }} />
            </div>
            {/* NFC symbol */}
            <div className="flex items-center gap-[3px] opacity-60">
              {[10, 14, 18].map(h => (
                <div key={h} className="rounded-full border border-white/70"
                  style={{ width: 2, height: h, background: 'transparent' }} />
              ))}
            </div>
          </div>

          {/* ── Card number ── */}
          <div className="relative z-10">
            <p className="font-mono font-bold text-white/95 tracking-[0.22em]"
              style={{ fontSize: 15, letterSpacing: '0.2em', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              {maskCardNumber(card?.lastFour || '0000')}
            </p>
          </div>

          {/* ── Bottom row: name + ends ── */}
          <div className="relative z-10 flex items-end justify-between">
            <div style={{ maxWidth: '60%' }}>
              <p className="text-[7px] font-bold uppercase tracking-[0.25em] text-white/45 mb-0.5">Card Name</p>
              <p className="text-sm font-bold text-white leading-tight truncate">{card?.nickname || 'My Card'}</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-bold uppercase tracking-[0.25em] text-white/45 mb-0.5">Ends</p>
              <p className="font-mono text-sm font-bold text-white">{card?.lastFour || '0000'}</p>
            </div>
          </div>

          {/* Card type watermark — top-right corner, behind header */}
          <div className="absolute top-12 right-4 z-0 opacity-[0.12]">
            <CardTypeIcon typeId={card?.cardType} size={44} color="#ffffff" />
          </div>

          {/* Frozen overlay */}
          {card?.isFrozen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl"
              style={{ background: 'rgba(8,14,31,0.65)', backdropFilter: 'blur(4px)' }}>
              <div className="flex items-center gap-2 rounded-2xl border border-pw-rose/35 bg-pw-rose-dim px-4 py-2.5"
                style={{ boxShadow: '0 0 24px rgba(244,63,94,0.2)' }}>
                <HiLockClosed className="w-4 h-4 text-pw-rose" />
                <span className="text-sm font-bold text-pw-rose">Paused</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Back ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl text-white"
          style={{
            background: scheme.gradient,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(8,14,31,0.42)' }} />
          {/* Mag stripe */}
          <div className="absolute inset-x-0 top-7 h-11 bg-black/65" />

          <div className="absolute left-5 right-5 top-[5.2rem] rounded-2xl border border-white/10 p-4"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Stored Safely</p>
              <HiShieldCheck className="w-3.5 h-3.5 text-pw-emerald" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Last 4', value: card?.lastFour || '0000' },
                { label: 'Type',   value: type.label },
                { label: 'CVV',    value: 'Hidden' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/40 text-[8px] font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-mono font-bold text-white text-xs truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-[10px] leading-relaxed text-white/50">
              Full card numbers, CVV, and expiry dates are never stored.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main Cards Page
   ════════════════════════════════════════════════════════════════════════════ */
export default function Cards() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { cards, setCards, cardsLoaded, addCardLocal, updateCardLocal, removeCardLocal } = useStore();

  const [showOTP,       setShowOTP]       = useState(false);
  const [otpPurpose,    setOtpPurpose]    = useState('add a card');
  const [pendingAction, setPendingAction] = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [editCard,      setEditCard]      = useState(null);
  const [selectedScheme,setSelectedScheme]= useState('midnight');
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [flipped,       setFlipped]       = useState(false);
  const [busyAction,    setBusyAction]    = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { cardType: 'visa', isPrimary: false },
  });

  useEffect(() => {
    if (!user || cardsLoaded) return;
    getCards(user.uid).then(c => setCards(c)).catch(() => setCards([]));
  }, [user, cardsLoaded, setCards]);

  useEffect(() => {
    if (cards.length > 0 && activeCardIdx >= cards.length)
      setActiveCardIdx(cards.length - 1);
  }, [cards.length, activeCardIdx]);

  const activeCard   = cards.length > 0 ? (cards[activeCardIdx] ?? cards[0]) : null;
  const activeType   = useMemo(() => cardTypeFor(activeCard), [activeCard]);
  const activeScheme = useMemo(() => schemeFor(activeCard), [activeCard]);
  const primaryCard  = cards.find(c => c.isPrimary);
  const frozenCount  = cards.filter(c => c.isFrozen).length;

  const selectCard = (i) => { setActiveCardIdx(i); setFlipped(false); };

  const initiateAdd = () => {
    setPendingAction('add');
    setEditCard(null);
    setOtpPurpose('add a new card');
    setShowOTP(true);
  };

  const initiateEdit = (card) => {
    setEditCard(card);
    setPendingAction('edit');
    setOtpPurpose(`edit card ending in ${card.lastFour}`);
    setShowOTP(true);
  };

  const onOTPVerified = () => {
    setShowOTP(false);
    if (pendingAction === 'edit' && editCard) {
      setValue('lastFour',  editCard.lastFour);
      setValue('cardType',  editCard.cardType || 'visa');
      setValue('nickname',  editCard.nickname || '');
      setValue('isPrimary', Boolean(editCard.isPrimary));
      setSelectedScheme(editCard.colorScheme || 'midnight');
    } else {
      reset({ lastFour: '', cardType: 'visa', nickname: '', isPrimary: cards.length === 0 });
      setEditCard(null);
      setSelectedScheme('midnight');
    }
    setShowModal(true);
  };

  const clearPrimaryCards = async (exceptId = null) => {
    await Promise.all(
      cards
        .filter(c => c.id !== exceptId && c.isPrimary)
        .map(async c => { await updateCard(c.id, { isPrimary: false }); updateCardLocal(c.id, { isPrimary: false }); })
    );
  };

  const onSubmit = async (data) => {
    if (!user) return;
    const lastFour = String(data.lastFour).replace(/\D/g, '');
    if (lastFour.length !== 4) { toast.error('Ilagay ang huling 4 na digit lamang.'); return; }

    try {
      const shouldBePrimary = cards.length === 0 || Boolean(data.isPrimary);
      const payload = {
        lastFour,
        cardType: data.cardType,
        nickname: data.nickname?.trim() || `My ${CARD_TYPES.find(t => t.id === data.cardType)?.label || 'Card'}`,
        colorScheme: selectedScheme,
        isPrimary: shouldBePrimary,
        isFrozen: editCard?.isFrozen || false,
      };
      if (shouldBePrimary) await clearPrimaryCards(editCard?.id || null);

      if (editCard) {
        await updateCard(editCard.id, payload);
        updateCardLocal(editCard.id, payload);
        toast.success('Card na-update!');
      } else {
        const ref = await addCard(user.uid, { ...payload, verified: true });
        addCardLocal({ id: ref.id, userId: user.uid, ...payload, verified: true, createdAt: Timestamp.now() });
        setActiveCardIdx(cards.length);
        toast.success('Card naidagdag!');
      }
      setShowModal(false);
      reset({ lastFour: '', cardType: 'visa', nickname: '', isPrimary: false });
      setEditCard(null);
      setFlipped(false);
    } catch (e) {
      console.error(e);
      toast.error('Hindi na-save. Subukan ulit.');
    }
  };

  const handleDelete = async (card) => {
    if (!card || !confirm('Tanggalin ang card na ito?')) return;
    setBusyAction(`delete-${card.id}`);
    try {
      const idx       = cards.findIndex(c => c.id === card.id);
      const remaining = cards.filter(c => c.id !== card.id);
      await deleteCard(card.id);
      removeCardLocal(card.id);
      setActiveCardIdx(curr => {
        if (!remaining.length) return 0;
        if (idx < curr) return curr - 1;
        if (idx === curr && curr >= remaining.length) return remaining.length - 1;
        return curr;
      });
      if (card.isPrimary && remaining[0]) {
        await updateCard(remaining[0].id, { isPrimary: true });
        updateCardLocal(remaining[0].id, { isPrimary: true });
      }
      setFlipped(false);
      toast.success('Card natanggal.');
    } catch { toast.error('Hindi natanggal.'); }
    finally { setBusyAction(null); }
  };

  const handleToggleFrozen = async (card) => {
    if (!card) return;
    const next = !card.isFrozen;
    setBusyAction(`freeze-${card.id}`);
    try {
      await updateCard(card.id, { isFrozen: next });
      updateCardLocal(card.id, { isFrozen: next });
      toast.success(next ? 'Card paused.' : 'Card activated.');
    } catch { toast.error('Hindi na-update.'); }
    finally { setBusyAction(null); }
  };

  const handleSetPrimary = async (card) => {
    if (!card || card.isPrimary) return;
    setBusyAction(`primary-${card.id}`);
    try {
      await Promise.all(cards.map(c => updateCard(c.id, { isPrimary: c.id === card.id })));
      cards.forEach(c => updateCardLocal(c.id, { isPrimary: c.id === card.id }));
      toast.success('Primary card updated.');
    } catch { toast.error('Hindi na-set as primary.'); }
    finally { setBusyAction(null); }
  };

  const handleCopy = async (card) => {
    if (!card) return;
    try {
      await navigator.clipboard.writeText(maskCardNumber(card.lastFour));
      toast.success('Masked number copied.');
    } catch { toast.error('Clipboard unavailable.'); }
  };

  /* ── Render ── */
  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-5 mx-auto w-full max-w-lg">

          {/* ── Header ── */}
          <div className="flex items-start justify-between pt-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: 'rgba(245,183,49,0.15)' }}>
                  <HiWallet className="w-3 h-3 text-pw-gold" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-pw-gold">Secure Wallet</span>
              </div>
              <h1 className="font-display text-3xl text-white leading-none">Card Wallet</h1>
              <p className="text-pw-muted text-sm mt-1">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'} saved
                {primaryCard ? ` · Primary ···· ${primaryCard.lastFour}` : ''}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={initiateAdd}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #F5B731 0%, #F59E0B 100%)',
                boxShadow: '0 4px 16px rgba(245,183,49,0.35)',
              }}>
              <HiPlus className="w-5 h-5 text-pw-navy" style={{ strokeWidth: 2.5 }} />
            </motion.button>
          </div>

          {/* ── Privacy banner ── */}
          <div className="glass-emerald flex items-start gap-3 p-4 rounded-2xl">
            <HiShieldCheck className="w-4 h-4 text-pw-emerald flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-pw-emerald text-xs font-semibold mb-0.5">Card Privacy</p>
              <p className="text-white/65 text-xs leading-relaxed">
                PisoWise saves only the label, type, design, status, and last 4 digits. Full numbers, CVV, and expiry dates are never collected.
              </p>
            </div>
          </div>

          {/* ── Empty state ── */}
          {cards.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 text-center">
              <div className="icon-box mx-auto mb-4" style={{ background: 'rgba(245,183,49,0.10)', width: 56, height: 56, borderRadius: 18 }}>
                <HiCreditCard className="w-6 h-6 text-pw-gold" style={{ width: 24, height: 24 }} />
              </div>
              <h2 className="font-display text-2xl text-white mb-2">Start your secure wallet</h2>
              <p className="text-pw-muted text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                Add a debit card, credit card, or e-wallet using only the last four digits.
              </p>
              <button onClick={initiateAdd} className="btn-primary w-full">
                <HiPlus className="w-4 h-4" /> Mag-dagdag ng Card
              </button>
            </motion.div>
          ) : (
            <div className="space-y-5">

              {/* ── Card visual + flip ── */}
              <AnimatePresence mode="wait">
                <motion.button
                  key={activeCard?.id || activeCardIdx}
                  type="button"
                  onClick={() => setFlipped(v => !v)}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="block w-full text-left cursor-pointer"
                  title={flipped ? 'Show front' : 'Show stored details'}
                >
                  <CreditCardVisual card={activeCard} flipped={flipped} />
                </motion.button>
              </AnimatePresence>

              {/* Flip hint */}
              <p className="text-center text-[10px] text-pw-muted font-medium tracking-wide">
                {flipped ? '← Tap to flip back' : 'Tap card to flip ↻'}
              </p>

              {/* Pagination dots */}
              {cards.length > 1 && (
                <div className="flex justify-center gap-2">
                  {cards.map((card, i) => (
                    <button key={card.id} onClick={() => selectCard(i)}
                      aria-label={`Select card ending ${card.lastFour}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === activeCardIdx ? 'w-6 bg-pw-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`} />
                  ))}
                </div>
              )}

              {/* ── Stat row ── */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Cards',   value: cards.length,  mono: true },
                  { label: 'Paused',  value: frozenCount,   mono: true },
                  { label: 'Design',  value: activeScheme.label, mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="glass-sm p-3">
                    <p className="section-title mb-1" style={{ fontSize: '9px' }}>{label}</p>
                    <p className={`text-white font-bold truncate ${mono ? 'font-mono text-xl peso-amount' : 'text-sm'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* ── Active card detail panel ── */}
              <div className="glass p-5 space-y-4">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="section-title mb-0.5">Active Card</p>
                    <h2 className="font-display text-2xl text-white leading-none mt-1">{activeCard.nickname}</h2>
                    <p className="text-pw-muted text-sm mt-1">
                      {activeType.label} · ends in <span className="font-mono text-white/80">{activeCard.lastFour}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {activeCard.isPrimary && <StatusPill tone="gold" icon={HiStar}>Primary</StatusPill>}
                    {activeCard.isFrozen
                      ? <StatusPill tone="rose" icon={HiLockClosed}>Paused</StatusPill>
                      : <StatusPill tone="emerald" icon={HiCheckCircle}>Active</StatusPill>
                    }
                  </div>
                </div>

                <div className="divider" />

                {/* 4-action grid */}
                <div className="grid grid-cols-4 gap-2">
                  <CardActionButton
                    icon={flipped ? HiEyeSlash : HiEye}
                    label={flipped ? 'Front' : 'Details'}
                    hint={flipped ? 'Show card front' : 'Flip to see stored details'}
                    onClick={() => setFlipped(v => !v)}
                  />
                  <CardActionButton
                    icon={activeCard.isFrozen ? HiPlayCircle : HiPauseCircle}
                    label={activeCard.isFrozen ? 'Activate' : 'Pause'}
                    active={activeCard.isFrozen}
                    disabled={busyAction === `freeze-${activeCard.id}`}
                    onClick={() => handleToggleFrozen(activeCard)}
                  />
                  <CardActionButton
                    icon={HiStar}
                    label={activeCard.isPrimary ? 'Primary' : 'Set Primary'}
                    active={activeCard.isPrimary}
                    disabled={activeCard.isPrimary || busyAction === `primary-${activeCard.id}`}
                    onClick={() => handleSetPrimary(activeCard)}
                  />
                  <CardActionButton
                    icon={HiClipboardDocument}
                    label="Copy"
                    hint="Copy masked card number"
                    onClick={() => handleCopy(activeCard)}
                  />
                </div>

                {/* 3-action row */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => navigate('/transactions?tab=expense')} className="btn-secondary text-xs py-2.5 gap-1.5">
                    <HiArrowsRightLeft className="w-3.5 h-3.5" /> Record Spend
                  </button>
                  <button onClick={() => initiateEdit(activeCard)} className="btn-secondary text-xs py-2.5 gap-1.5">
                    <HiPencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    disabled={busyAction === `delete-${activeCard.id}`}
                    onClick={() => handleDelete(activeCard)}
                    className="btn-danger text-xs py-2.5 gap-1.5"
                  >
                    <HiTrash className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Status note */}
                <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                  {activeCard.isFrozen
                    ? <HiLockClosed className="w-3.5 h-3.5 text-pw-rose flex-shrink-0 mt-0.5" />
                    : <HiLockOpen   className="w-3.5 h-3.5 text-pw-emerald flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-[11px] text-pw-muted leading-relaxed">
                    Pause/activate is a PisoWise status only — it does not contact your bank or e-wallet.
                  </p>
                </div>
              </div>

              {/* ── All cards list ── */}
              {cards.length > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="section-title mb-0">All Cards</p>
                    <p className="text-xs text-pw-muted">{cards.length} saved</p>
                  </div>
                  <div className="space-y-2">
                    {cards.map((card, i) => {
                      const sch     = schemeFor(card);
                      const tp      = cardTypeFor(card);
                      const isActive = i === activeCardIdx;
                      return (
                        <motion.button key={card.id} type="button" whileTap={{ scale: 0.98 }}
                          onClick={() => selectCard(i)}
                          className={`flex w-full items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                            isActive
                              ? 'border-pw-gold/30 bg-pw-gold-dim'
                              : 'border-white/[0.07] bg-white/[0.035] hover:border-white/15 hover:bg-white/[0.06]'
                          }`}
                        >
                          {/* Mini card swatch */}
                          <div className="w-14 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                            style={{ background: sch.gradient, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <CardTypeIcon typeId={card.cardType} size={16} color="rgba(255,255,255,0.7)" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-white truncate">{card.nickname}</p>
                              {card.isPrimary && <HiStar className="w-3 h-3 text-pw-gold flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-pw-muted mt-0.5">
                              {tp.label} · <span className="font-mono">···· {card.lastFour}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {card.isFrozen && <HiLockClosed className="w-3.5 h-3.5 text-pw-rose" />}
                            <HiChevronRight className="w-4 h-4 text-pw-muted" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── OTP Modal ── */}
      <OTPModal isOpen={showOTP} onClose={() => setShowOTP(false)} onVerified={onOTPVerified} purpose={otpPurpose} />

      {/* ── Add/Edit Sheet ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)} />

            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ maxHeight: '90dvh' }}
            >
              <div className="overflow-y-auto sheet-modal px-5 pt-5"
                style={{ background: 'rgba(10,18,35,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90dvh' }}>

                {/* Handle + close */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                  <button onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-pw-muted hover:text-white hover:bg-pw-subtle transition-all cursor-pointer">
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>

                {/* Live card preview */}
                <div className="mb-5">
                  <CreditCardVisual card={{
                    lastFour:    watch('lastFour') || '0000',
                    cardType:    watch('cardType') || 'visa',
                    nickname:    watch('nickname') || 'My Card',
                    colorScheme: selectedScheme,
                    isPrimary:   watch('isPrimary'),
                    isFrozen:    editCard?.isFrozen || false,
                  }} />
                </div>

                {/* Title */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="section-title mb-0.5">Card Setup</p>
                    <h2 className="font-display text-2xl text-white">
                      {editCard ? 'I-edit ang Card' : 'Mag-dagdag ng Card'}
                    </h2>
                  </div>
                  <StatusPill tone="emerald" icon={HiShieldCheck}>OTP verified</StatusPill>
                </div>

                {/* Security note */}
                <div className="glass-emerald flex items-start gap-2.5 p-3 rounded-xl mb-5">
                  <HiShieldCheck className="w-3.5 h-3.5 text-pw-emerald flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/70 leading-relaxed">
                    Ilagay lamang ang <strong className="text-white">huling 4 digit</strong>. Huwag ilagay ang buong numero, CVV, o expiry date.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                  {/* Last 4 */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">
                      Huling 4 Digit <span className="text-pw-rose">*</span>
                    </label>
                    <input type="text" inputMode="numeric" placeholder="1234" maxLength={4}
                      className="input-glass text-center font-mono text-3xl tracking-[0.4em] peso-amount"
                      disabled={!!editCard}
                      {...register('lastFour', {
                        required: 'Ilagay ang huling 4 digit',
                        pattern:  { value: /^\d{4}$/, message: 'Dapat eksaktong 4 na numero' },
                      })} />
                    {editCard && <p className="mt-1.5 text-xs text-pw-muted">Hindi mababago ang card number.</p>}
                    {errors.lastFour && <p className="mt-1.5 text-xs text-pw-rose">{errors.lastFour.message}</p>}
                  </div>

                  {/* Card type — SVG grid, no emojis or dropdown */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-2 font-semibold uppercase tracking-wide">Uri ng Card</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CARD_TYPES.slice(0, 8).map(t => {
                        const isSelected = watch('cardType') === t.id;
                        return (
                          <label key={t.id} className="cursor-pointer">
                            <input type="radio" value={t.id} className="sr-only"
                              {...register('cardType', { required: true })} />
                            <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                              isSelected
                                ? 'border-pw-gold/45 bg-pw-gold-dim'
                                : 'border-white/[0.07] bg-white/[0.03] hover:border-white/15'
                            }`}>
                              <div className={`transition-colors ${isSelected ? 'text-pw-gold' : 'text-pw-muted'}`}>
                                <CardTypeIcon typeId={t.id} size={20} color={isSelected ? '#F5B731' : 'rgba(255,255,255,0.42)'} />
                              </div>
                              <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? 'text-pw-gold' : 'text-pw-muted'}`}>
                                {t.label}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {/* Remaining as slim select */}
                    {CARD_TYPES.length > 8 && (
                      <select className="input-glass text-sm mt-2" {...register('cardType')}>
                        {CARD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Nickname */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">Nickname</label>
                    <input type="text" placeholder="hal. BDO ATM, GCash Pang-emergency…"
                      className="input-glass" maxLength={40} {...register('nickname')} />
                  </div>

                  {/* Card design swatches */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-2 font-semibold uppercase tracking-wide">Card Design</label>
                    <div className="grid grid-cols-5 gap-2">
                      {CARD_COLOR_SCHEMES.map(s => (
                        <button key={s.id} type="button" onClick={() => setSelectedScheme(s.id)} title={s.label}
                          className={`h-9 rounded-xl border transition-all cursor-pointer ${
                            selectedScheme === s.id
                              ? 'scale-105 ring-2 ring-white/60 ring-offset-1 ring-offset-pw-dark border-white/20'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ background: s.gradient }} />
                      ))}
                    </div>
                    <p className="text-[10px] text-pw-muted mt-1.5">{CARD_COLOR_SCHEMES.find(s => s.id === selectedScheme)?.label}</p>
                  </div>

                  {/* Primary toggle */}
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 cursor-pointer hover:border-white/15 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-white">Set as primary card</p>
                      <p className="text-xs text-pw-muted mt-0.5">Only one card can be primary.</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-pw-gold cursor-pointer" {...register('isPrimary')} />
                  </label>

                  {/* Submit row */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Kanselahin</button>
                    <button type="submit" className="btn-primary">{editCard ? 'I-update' : 'I-save'}</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
