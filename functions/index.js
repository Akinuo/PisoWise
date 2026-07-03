// functions/index.js
// ─────────────────────────────────────────────────────────────────────────────
// PisoWise Cloud Functions
// NOTE: Cloud Functions require Firebase Blaze (pay-as-you-go) plan.
// These functions are provided as production-ready code for when you upgrade.
// On Spark plan, these features fall back to client-side implementations.
// ─────────────────────────────────────────────────────────────────────────────

const { onDocumentCreated }  = require('firebase-functions/v2/firestore');
const { onSchedule }         = require('firebase-functions/v2/scheduler');
const { onRequest }          = require('firebase-functions/v2/https');
const { initializeApp }      = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging }       = require('firebase-admin/messaging');
const logger                 = require('firebase-functions/logger');

initializeApp();
const db = getFirestore();

// ─────────────────────────────────────────────────────────────────────────────
// 1. SPENDING ALERT — triggers when a transaction is added
//    Sends push notification if user is over 80% of their monthly budget
// ─────────────────────────────────────────────────────────────────────────────
exports.onTransactionAdded = onDocumentCreated(
  'transactions/{transactionId}',
  async (event) => {
    const tx = event.data.data();
    if (tx.type !== 'expense') return null;

    const { userId, amount, category } = tx;
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    try {
      // Get user profile (for FCM token and monthly income)
      const userSnap = await db.doc(`users/${userId}`).get();
      if (!userSnap.exists) return null;
      const user = userSnap.data();
      if (!user.fcmToken || !user.monthlyIncome) return null;

      // Sum this month's expenses
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);

      const txSnap = await db.collection('transactions')
        .where('userId', '==', userId)
        .where('type',   '==', 'expense')
        .where('date',   '>=', start)
        .where('date',   '<=', end)
        .get();

      const totalExpenses = txSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      const budgetPct     = totalExpenses / user.monthlyIncome;

      // Alert at 80% and 100% of monthly income spent
      let alertMsg = null;
      if (budgetPct >= 1.0 && budgetPct < 1.05) {
        alertMsg = {
          title: '⚠️ Over Budget!',
          body:  `Ang iyong gastos ay lumampas na sa buwanang kita! Mag-ingat at pigilan ang dagdag na gastos.`,
        };
      } else if (budgetPct >= 0.8 && budgetPct < 0.85) {
        alertMsg = {
          title: '💡 Budget Warning',
          body:  `Nagastos mo na ang 80% ng iyong buwanang kita. Mag-ingat sa mga susunod na gastos.`,
        };
      }

      if (alertMsg) {
        await getMessaging().send({
          token:   user.fcmToken,
          notification: alertMsg,
          data:    { type: 'budget_alert', month: String(month), year: String(year) },
          android: { priority: 'high', notification: { channelId: 'budget_alerts', icon: 'ic_notification', color: '#F7C13A' } },
        });
        logger.info(`Budget alert sent to user ${userId}: ${budgetPct * 100}% of income spent`);
      }
    } catch (err) {
      logger.error('Error in onTransactionAdded:', err);
    }
    return null;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. WEEKLY SUMMARY — runs every Monday at 8:00 AM PH time
//    Sends a push notification with the previous week's spending summary
// ─────────────────────────────────────────────────────────────────────────────
exports.weeklySummaryNotification = onSchedule(
  { schedule: '0 8 * * 1', timeZone: 'Asia/Manila' },
  async () => {
    logger.info('Running weekly summary notifications...');

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    try {
      // Get all users with FCM tokens
      const usersSnap = await db.collection('users')
        .where('fcmToken', '!=', null)
        .limit(500) // Spark plan friendly batch size
        .get();

      const notifications = usersSnap.docs.map(async (userDoc) => {
        const user = userDoc.data();
        if (!user.fcmToken) return;

        // Get this user's transactions from past week
        const txSnap = await db.collection('transactions')
          .where('userId', '==', userDoc.id)
          .where('date',   '>=', weekAgo)
          .get();

        const income   = txSnap.docs.filter(d => d.data().type === 'income').reduce((s, d) => s + d.data().amount, 0);
        const expenses = txSnap.docs.filter(d => d.data().type === 'expense').reduce((s, d) => s + d.data().amount, 0);

        const pesoFormat = (n) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

        try {
          await getMessaging().send({
            token: user.fcmToken,
            notification: {
              title: '📊 Lingguhang Buod ng Pera',
              body:  `Nakaraang Linggo: Kita ${pesoFormat(income)}, Gastos ${pesoFormat(expenses)}, Net ${pesoFormat(income - expenses)}`,
            },
            data: { type: 'weekly_summary' },
            android: { notification: { channelId: 'weekly_summary', icon: 'ic_notification', color: '#10B981' } },
          });
        } catch (err) {
          // Invalid token — clean it up
          if (err.code === 'messaging/registration-token-not-registered') {
            await db.doc(`users/${userDoc.id}`).update({ fcmToken: FieldValue.delete() });
          }
        }
      });

      await Promise.allSettled(notifications);
      logger.info(`Weekly summaries sent to ${usersSnap.docs.length} users`);
    } catch (err) {
      logger.error('Error in weeklySummaryNotification:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. CLEANUP OTP TOKENS — runs daily at 2:00 AM PH time
//    Deletes expired OTP tokens to keep Firestore clean (Spark plan optimization)
// ─────────────────────────────────────────────────────────────────────────────
exports.cleanupExpiredOTPs = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'Asia/Manila' },
  async () => {
    const now = new Date();
    try {
      const snap = await db.collection('otpTokens')
        .where('expiresAt', '<', now)
        .limit(200)
        .get();

      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      logger.info(`Deleted ${snap.docs.length} expired OTP tokens`);
    } catch (err) {
      logger.error('Error in cleanupExpiredOTPs:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. DEBT PAYMENT REMINDER — runs daily at 9:00 AM PH time
//    Notifies users about upcoming debt payments
// ─────────────────────────────────────────────────────────────────────────────
exports.debtPaymentReminder = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'Asia/Manila' },
  async () => {
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 3); // 3 days ahead

    try {
      const debtsSnap = await db.collection('debts')
        .where('remainingAmount', '>', 0)
        .where('dueDate', '<=', tomorrow.toISOString().slice(0, 10))
        .limit(200)
        .get();

      for (const debtDoc of debtsSnap.docs) {
        const debt = debtDoc.data();
        const userDoc = await db.doc(`users/${debt.userId}`).get();
        if (!userDoc.exists || !userDoc.data().fcmToken) continue;

        const daysLeft = Math.ceil((new Date(debt.dueDate) - today) / (1000 * 60 * 60 * 24));
        const msg = daysLeft <= 0
          ? `Ang iyong utang kay ${debt.creditorName} ay dapat na bayaran ngayon!`
          : `${daysLeft} araw na lang bago mag-due ang bayad mo kay ${debt.creditorName}.`;

        try {
          await getMessaging().send({
            token: userDoc.data().fcmToken,
            notification: { title: '💳 Paalala sa Utang', body: msg },
            data: { type: 'debt_reminder', debtId: debtDoc.id },
            android: { notification: { channelId: 'debt_reminders', icon: 'ic_notification', color: '#F43F5E' } },
          });
        } catch (err) {
          if (err.code === 'messaging/registration-token-not-registered') {
            await db.doc(`users/${debt.userId}`).update({ fcmToken: FieldValue.delete() });
          }
        }
      }
      logger.info('Debt payment reminders sent successfully');
    } catch (err) {
      logger.error('Error in debtPaymentReminder:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. FINANCIAL HEALTH CHECK — runs on 1st of each month
//    Sends monthly financial health score update
// ─────────────────────────────────────────────────────────────────────────────
exports.monthlyHealthCheck = onSchedule(
  { schedule: '0 10 1 * *', timeZone: 'Asia/Manila' },
  async () => {
    logger.info('Running monthly health check notifications...');

    try {
      const usersSnap = await db.collection('users')
        .where('fcmToken', '!=', null)
        .limit(500)
        .get();

      for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        if (!user.fcmToken) continue;

        try {
          await getMessaging().send({
            token: user.fcmToken,
            notification: {
              title: '📅 Bagong Buwan, Bagong Simula!',
              body:  'Suriin ang iyong financial health score at planuhin ang bagong buwan. Kaya mo ito!',
            },
            data: { type: 'monthly_check' },
            android: { notification: { channelId: 'monthly_check', icon: 'ic_notification', color: '#3B82F6' } },
          });
        } catch {}
      }
      logger.info('Monthly health check notifications sent');
    } catch (err) {
      logger.error('Error in monthlyHealthCheck:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. HEALTH CHECK ENDPOINT — simple ping to verify functions are deployed
// ─────────────────────────────────────────────────────────────────────────────
exports.ping = onRequest({ cors: true }, (req, res) => {
  res.json({
    status:  'ok',
    app:     'PisoWise',
    version: '1.0.0',
    time:    new Date().toISOString(),
    region:  'asia-east1',
  });
});
