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
  HiPlus,
  HiTrash,
  HiPencil,
  HiCreditCard,
  HiShieldCheck,
  HiEye,
  HiEyeSlash,
  HiLockClosed,
  HiLockOpen,
  HiStar,
  HiClipboardDocument,
  HiArrowsRightLeft,
  HiCheckCircle,
  HiPauseCircle,
  HiPlayCircle,
  HiWallet,
} from 'react-icons/hi2';

const cardTypeFor = (card) =>
  CARD_TYPES.find((t) => t.id === card?.cardType) || CARD_TYPES[CARD_TYPES.length - 1];

const schemeFor = (card) =>
  CARD_COLOR_SCHEMES.find((s) => s.id === card?.colorScheme) || CARD_COLOR_SCHEMES[0];

function StatusPill({ children, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'border-white/10 bg-white/10 text-white/75',
    gold: 'border-pw-gold/25 bg-pw-gold-dim text-pw-gold',
    emerald: 'border-pw-emerald/25 bg-pw-emerald-dim text-pw-emerald',
    rose: 'border-pw-rose/25 bg-pw-rose-dim text-pw-rose',
  };

  return (
    <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold ${tones[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function CardActionButton({ icon: Icon, label, hint, onClick, active = false, danger = false, disabled = false }) {
  const stateClass = danger
    ? 'border-pw-rose/25 bg-pw-rose-dim text-pw-rose hover:border-pw-rose/45'
    : active
      ? 'border-pw-gold/35 bg-pw-gold-dim text-pw-gold'
      : 'border-white/10 bg-white/[0.05] text-white hover:border-white/20 hover:bg-white/[0.08]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint || label}
      className={`group flex min-h-[74px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${stateClass}`}
    >
      <Icon className="h-5 w-5 transition-transform group-hover:scale-105" />
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </button>
  );
}

function CreditCardVisual({ card, flipped = false }) {
  const scheme = schemeFor(card);
  const type = cardTypeFor(card);
  const status = card?.isFrozen
    ? { label: 'Paused', tone: 'rose', icon: HiLockClosed }
    : card?.isPrimary
      ? { label: 'Primary', tone: 'gold', icon: HiStar }
      : { label: 'Verified', tone: 'emerald', icon: HiCheckCircle };

  return (
    <div className="relative aspect-[1.586/1] w-full select-none [perspective:1200px]">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="card-shine absolute inset-0 overflow-hidden rounded-[28px] border border-white/15 text-white shadow-card [backface-visibility:hidden]"
          style={{
            background: scheme.gradient,
            boxShadow: '0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)',
          }}
        >
          <div className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                'linear-gradient(115deg, transparent 0 42%, rgba(255,255,255,0.32) 42% 43%, transparent 43% 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 18px)',
            }}
          />

          <div className="relative z-10 flex items-start justify-between p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">PisoWise</p>
              <p className="mt-1 text-sm font-bold text-white">{type.label}</p>
            </div>
            <StatusPill tone={status.tone} icon={status.icon}>{status.label}</StatusPill>
          </div>

          <div className="absolute left-5 top-[31%] z-10">
            <div className="flex h-9 w-11 items-center justify-center rounded-xl border border-yellow-900/20 bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-500 shadow-inner">
              <div className="h-6 w-8 rounded-md border border-yellow-700/30"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 48%, rgba(120,80,0,0.28) 49% 51%, transparent 52%), repeating-linear-gradient(0deg, rgba(120,80,0,0.22) 0 1px, transparent 1px 5px)',
                }}
              />
            </div>
          </div>

          <div className="absolute right-5 top-[34%] z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <div className="h-5 w-5 rounded-full border-2 border-white/70" />
          </div>

          <div className="absolute bottom-[4.7rem] left-5 right-5 z-10">
            <p className="font-mono text-[15px] font-bold tracking-[0.12em] text-white/95 min-[380px]:text-base sm:text-lg">
              {maskCardNumber(card?.lastFour || '0000')}
            </p>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">Card Name</p>
              <p className="truncate text-sm font-bold text-white sm:text-base">{card?.nickname || 'My Card'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">Ends</p>
              <p className="font-mono text-sm font-bold text-white">{card?.lastFour || '0000'}</p>
            </div>
          </div>

          {card?.isFrozen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-pw-navy/55 backdrop-blur-[2px]">
              <div className="rounded-2xl border border-pw-rose/30 bg-pw-rose-dim px-4 py-2 text-sm font-bold text-pw-rose">
                Paused in PisoWise
              </div>
            </div>
          )}
        </div>

        <div
          className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/15 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            background: scheme.gradient,
            boxShadow: '0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)',
          }}
        >
          <div className="absolute inset-0 bg-pw-navy/30" />
          <div className="absolute inset-x-0 top-8 h-11 bg-black/55" />
          <div className="absolute left-5 right-5 top-[5.8rem] rounded-2xl border border-white/10 bg-white/[0.12] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Stored Safely</p>
              <HiShieldCheck className="h-4 w-4 text-pw-emerald" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-white/45">Last 4</p>
                <p className="mt-0.5 font-mono font-bold">{card?.lastFour || '0000'}</p>
              </div>
              <div>
                <p className="text-white/45">Type</p>
                <p className="mt-0.5 truncate font-bold">{type.label}</p>
              </div>
              <div>
                <p className="text-white/45">CVV</p>
                <p className="mt-0.5 font-bold">Not saved</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-xs leading-relaxed text-white/65">
              PisoWise keeps only non-sensitive card labels and the last four digits.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Cards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cards, setCards, cardsLoaded, addCardLocal, updateCardLocal, removeCardLocal } = useStore();

  const [showOTP, setShowOTP] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState('add a card');
  const [pendingAction, setPendingAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState('midnight');
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busyAction, setBusyAction] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { cardType: 'visa', isPrimary: false },
  });

  useEffect(() => {
    if (!user || cardsLoaded) return;
    getCards(user.uid).then((c) => setCards(c)).catch(console.error);
  }, [user, cardsLoaded, setCards]);

  useEffect(() => {
    if (cards.length === 0) {
      setActiveCardIdx(0);
      return;
    }
    if (activeCardIdx > cards.length - 1) setActiveCardIdx(cards.length - 1);
  }, [cards.length, activeCardIdx]);

  const activeCard = cards[activeCardIdx] || cards[0];
  const activeType = useMemo(() => cardTypeFor(activeCard), [activeCard]);
  const activeScheme = useMemo(() => schemeFor(activeCard), [activeCard]);
  const primaryCard = cards.find((card) => card.isPrimary);
  const frozenCount = cards.filter((card) => card.isFrozen).length;

  const selectCard = (index) => {
    setActiveCardIdx(index);
    setFlipped(false);
  };

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
      setValue('lastFour', editCard.lastFour);
      setValue('cardType', editCard.cardType || 'visa');
      setValue('nickname', editCard.nickname || '');
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
    const updates = cards
      .filter((card) => card.id !== exceptId && card.isPrimary)
      .map(async (card) => {
        await updateCard(card.id, { isPrimary: false });
        updateCardLocal(card.id, { isPrimary: false });
      });
    await Promise.all(updates);
  };

  const onSubmit = async (data) => {
    if (!user) return;
    if (data.fullNumber || data.cvv || data.expiryDate) {
      toast.error('Security error: do not enter full card details.');
      return;
    }

    const lastFour = String(data.lastFour).replace(/\D/g, '');
    if (lastFour.length !== 4) {
      toast.error('Ilagay ang huling 4 na digit lamang.');
      return;
    }

    try {
      const shouldBePrimary = cards.length === 0 || Boolean(data.isPrimary);
      const payload = {
        lastFour,
        cardType: data.cardType,
        nickname: data.nickname?.trim() || `My ${CARD_TYPES.find((t) => t.id === data.cardType)?.label || 'Card'}`,
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
        addCardLocal({
          id: ref.id,
          userId: user.uid,
          ...payload,
          verified: true,
          createdAt: Timestamp.now(),
        });
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
      const remaining = cards.filter((item) => item.id !== card.id);
      const nextPrimary = card.isPrimary ? remaining[0] : null;

      await deleteCard(card.id);
      removeCardLocal(card.id);

      if (nextPrimary) {
        await updateCard(nextPrimary.id, { isPrimary: true });
        updateCardLocal(nextPrimary.id, { isPrimary: true });
      }

      setFlipped(false);
      toast.success('Card natanggal.');
    } catch {
      toast.error('Hindi natanggal.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleFrozen = async (card) => {
    if (!card) return;
    const nextValue = !card.isFrozen;
    setBusyAction(`freeze-${card.id}`);
    try {
      await updateCard(card.id, { isFrozen: nextValue });
      updateCardLocal(card.id, { isFrozen: nextValue });
      toast.success(nextValue ? 'Card paused in PisoWise.' : 'Card active again.');
    } catch {
      toast.error('Hindi na-update ang status.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSetPrimary = async (card) => {
    if (!card || card.isPrimary) return;
    setBusyAction(`primary-${card.id}`);
    try {
      await Promise.all(cards.map((item) => updateCard(item.id, { isPrimary: item.id === card.id })));
      cards.forEach((item) => updateCardLocal(item.id, { isPrimary: item.id === card.id }));
      toast.success('Primary card updated.');
    } catch {
      toast.error('Hindi na-set as primary.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopy = async (card) => {
    if (!card) return;
    try {
      await navigator.clipboard.writeText(maskCardNumber(card.lastFour));
      toast.success('Masked card copied.');
    } catch {
      toast.error('Clipboard is not available.');
    }
  };

  const handleRecordSpend = () => {
    navigate('/transactions?tab=expense');
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <div className="flex items-start justify-between gap-4 pt-2">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pw-gold">
                <HiWallet className="h-3.5 w-3.5" />
                Secure Wallet
              </div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Card Wallet</h1>
              <p className="mt-1 text-sm text-pw-muted">
                {cards.length} card{cards.length !== 1 ? 's' : ''} saved
                {primaryCard ? ` · Primary ends in ${primaryCard.lastFour}` : ''}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={initiateAdd}
              className="btn-primary shrink-0 px-4 py-2.5"
            >
              <HiPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Dagdag</span>
            </motion.button>
          </div>

          <div className="rounded-2xl border border-pw-emerald/20 bg-pw-emerald-dim p-3">
            <div className="flex gap-3">
              <HiShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-pw-emerald" />
              <div>
                <p className="text-xs font-semibold text-pw-emerald">Card privacy</p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">
                  PisoWise saves only the card label, type, design, status, and last 4 digits. Full card numbers, CVV, and expiry dates are never collected.
                </p>
              </div>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-glass sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-pw-gold/20 bg-pw-gold-dim">
                  <HiCreditCard className="h-6 w-6 text-pw-gold" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white">Start your secure wallet</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-pw-muted">
                  Add a debit card, credit card, bank card, or e-wallet label using only the last four digits.
                </p>
              </div>
              <button onClick={initiateAdd} className="btn-primary w-full px-6 sm:w-auto">
                <HiPlus className="h-4 w-4" />
                Mag-dagdag ng Card
              </button>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(340px,430px)_1fr]">
              <section className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.button
                    key={activeCard?.id || activeCardIdx}
                    type="button"
                    onClick={() => setFlipped((value) => !value)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.22 }}
                    className="block w-full text-left"
                    title={flipped ? 'Show front' : 'Show stored details'}
                  >
                    <CreditCardVisual card={activeCard} flipped={flipped} />
                  </motion.button>
                </AnimatePresence>

                {cards.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {cards.map((card, index) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => selectCard(index)}
                        aria-label={`Select card ending ${card.lastFour}`}
                        className={`h-2 rounded-full transition-all ${
                          index === activeCardIdx ? 'w-7 bg-pw-gold' : 'w-2 bg-white/20 hover:bg-white/35'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[11px] text-pw-muted">Cards</p>
                    <p className="mt-1 font-mono text-xl font-bold text-white">{cards.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[11px] text-pw-muted">Paused</p>
                    <p className="mt-1 font-mono text-xl font-bold text-white">{frozenCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[11px] text-pw-muted">Design</p>
                    <p className="mt-1 truncate text-sm font-bold text-white">{activeScheme.label}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-glass">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pw-muted">Active Card</p>
                      <h2 className="mt-1 truncate font-display text-2xl font-bold text-white">{activeCard.nickname}</h2>
                      <p className="mt-1 text-sm text-pw-muted">{activeType.label} · ends in {activeCard.lastFour}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeCard.isPrimary && <StatusPill tone="gold" icon={HiStar}>Primary</StatusPill>}
                      {activeCard.isFrozen ? (
                        <StatusPill tone="rose" icon={HiLockClosed}>Paused</StatusPill>
                      ) : (
                        <StatusPill tone="emerald" icon={HiCheckCircle}>Active</StatusPill>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <CardActionButton
                      icon={flipped ? HiEyeSlash : HiEye}
                      label={flipped ? 'Front' : 'Details'}
                      hint={flipped ? 'Show card front' : 'Show stored card details'}
                      onClick={() => setFlipped((value) => !value)}
                    />
                    <CardActionButton
                      icon={activeCard.isFrozen ? HiPlayCircle : HiPauseCircle}
                      label={activeCard.isFrozen ? 'Activate' : 'Pause'}
                      hint="Mark this card as paused inside PisoWise"
                      onClick={() => handleToggleFrozen(activeCard)}
                      active={activeCard.isFrozen}
                      disabled={busyAction === `freeze-${activeCard.id}`}
                    />
                    <CardActionButton
                      icon={HiStar}
                      label={activeCard.isPrimary ? 'Primary' : 'Set Primary'}
                      hint="Use this as the main card"
                      onClick={() => handleSetPrimary(activeCard)}
                      active={activeCard.isPrimary}
                      disabled={activeCard.isPrimary || busyAction === `primary-${activeCard.id}`}
                    />
                    <CardActionButton
                      icon={HiClipboardDocument}
                      label="Copy Mask"
                      hint="Copy the masked card number"
                      onClick={() => handleCopy(activeCard)}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={handleRecordSpend} className="btn-secondary px-3 py-2.5 text-xs">
                      <HiArrowsRightLeft className="h-4 w-4" />
                      Spend
                    </button>
                    <button type="button" onClick={() => initiateEdit(activeCard)} className="btn-secondary px-3 py-2.5 text-xs">
                      <HiPencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(activeCard)}
                      disabled={busyAction === `delete-${activeCard.id}`}
                      className="btn-danger px-3 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HiTrash className="h-4 w-4" />
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-pw-subtle p-3">
                    {activeCard.isFrozen ? (
                      <HiLockClosed className="mt-0.5 h-4 w-4 shrink-0 text-pw-rose" />
                    ) : (
                      <HiLockOpen className="mt-0.5 h-4 w-4 shrink-0 text-pw-emerald" />
                    )}
                    <p className="text-xs leading-relaxed text-pw-muted">
                      Pause/activate is a PisoWise status only. It does not contact your bank or e-wallet provider.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="section-title mb-0">All Cards</p>
                    <p className="text-xs text-pw-muted">{cards.length} saved</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {cards.map((card, index) => {
                      const scheme = schemeFor(card);
                      const type = cardTypeFor(card);
                      const isActive = index === activeCardIdx;

                      return (
                        <motion.button
                          key={card.id}
                          type="button"
                          onClick={() => selectCard(index)}
                          whileTap={{ scale: 0.98 }}
                          className={`flex min-h-[82px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                            isActive
                              ? 'border-pw-gold/35 bg-pw-gold-dim'
                              : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="h-11 w-16 shrink-0 rounded-xl border border-white/10 shadow-inner"
                            style={{ background: scheme.gradient }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-white">{card.nickname}</p>
                              {card.isPrimary && <HiStar className="h-3.5 w-3.5 shrink-0 text-pw-gold" />}
                            </div>
                            <p className="mt-1 text-xs text-pw-muted">{type.label} · ends {card.lastFour}</p>
                            {card.createdAt && (
                              <p className="mt-0.5 text-[11px] text-white/35">Added {formatDate(card.createdAt, 'short')}</p>
                            )}
                          </div>
                          {card.isFrozen && <HiLockClosed className="h-4 w-4 shrink-0 text-pw-rose" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        onVerified={onOTPVerified}
        purpose={otpPurpose}
      />

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-pw-dark/[0.98] p-6 shadow-card backdrop-blur-glass sm:mx-auto sm:max-w-2xl"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

              <div className="mb-5">
                <CreditCardVisual
                  card={{
                    lastFour: watch('lastFour') || '0000',
                    cardType: watch('cardType') || 'visa',
                    nickname: watch('nickname') || 'My Card',
                    colorScheme: selectedScheme,
                    isPrimary: watch('isPrimary'),
                    isFrozen: editCard?.isFrozen || false,
                    verified: true,
                  }}
                />
              </div>

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pw-gold">Card Setup</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    {editCard ? 'I-edit ang Card' : 'Mag-dagdag ng Card'}
                  </h2>
                </div>
                <StatusPill tone="emerald" icon={HiShieldCheck}>OTP verified</StatusPill>
              </div>

              <div className="mb-4 rounded-2xl border border-pw-emerald/20 bg-pw-emerald-dim p-3">
                <p className="text-xs leading-relaxed text-white/75">
                  Ilagay lamang ang <strong className="text-white">huling 4 digit</strong>. Huwag ilagay ang buong numero, CVV, o expiry date.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-pw-muted">
                    Huling 4 Digit ng Card <span className="text-pw-rose">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    maxLength={4}
                    className="input-glass text-center font-mono text-2xl tracking-widest"
                    disabled={!!editCard}
                    {...register('lastFour', {
                      required: 'Ilagay ang huling 4 digit',
                      pattern: { value: /^\d{4}$/, message: 'Dapat eksaktong 4 na numero' },
                    })}
                  />
                  {editCard && <p className="mt-1 text-xs text-pw-muted">Hindi mababago ang card number.</p>}
                  {errors.lastFour && <p className="mt-1 text-xs text-pw-rose">{errors.lastFour.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs text-pw-muted">Uri ng Card</label>
                  <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {CARD_TYPES.slice(0, 6).map((type) => (
                      <label key={type.id} className="cursor-pointer">
                        <input
                          type="radio"
                          value={type.id}
                          className="sr-only"
                          {...register('cardType', { required: 'Pumili ng uri ng card' })}
                        />
                        <div className={`min-h-[66px] rounded-xl border p-2 text-center transition-all ${
                          watch('cardType') === type.id
                            ? 'border-pw-gold/50 bg-pw-gold-dim'
                            : 'border-white/10 bg-pw-subtle hover:border-white/20'
                        }`}>
                          <span className="block text-lg">{type.icon}</span>
                          <span className="mt-0.5 block text-[10px] leading-tight text-pw-muted">{type.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <select className="input-glass text-sm" {...register('cardType', { required: 'Pumili ng uri' })}>
                    <option value="">Pumili ng uri ng card...</option>
                    {CARD_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                  {errors.cardType && <p className="mt-1 text-xs text-pw-rose">{errors.cardType.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-pw-muted">Nickname ng Card</label>
                  <input
                    type="text"
                    placeholder="hal. BDO ATM, GCash Pang-emergency..."
                    className="input-glass"
                    maxLength={40}
                    {...register('nickname')}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-pw-muted">Card Design</label>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {CARD_COLOR_SCHEMES.map((scheme) => (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => setSelectedScheme(scheme.id)}
                        className={`h-11 rounded-xl border border-white/10 transition-all ${
                          selectedScheme === scheme.id ? 'scale-105 ring-2 ring-white/70' : 'hover:scale-105'
                        }`}
                        style={{ background: scheme.gradient }}
                        title={scheme.label}
                      />
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Set as primary card</p>
                    <p className="mt-0.5 text-xs text-pw-muted">Only one card can be primary at a time.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-pw-gold"
                    {...register('isPrimary')}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Kanselahin
                  </button>
                  <button type="submit" className="btn-primary">
                    {editCard ? 'I-update' : 'I-save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
