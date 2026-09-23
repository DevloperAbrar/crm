const stringSimilarity = require('string-similarity');
const FraudFlag = require('../models/FraudFlag');
const Interaction = require('../models/Interaction');
const Lead = require('../models/Lead');
const { FRAUD_FAST_LOG_SECONDS, STALE_LEAD_DAYS } = require('../config/env');
const { getIO, rooms } = require('../config/socket');
const User = require('../models/User');

const DUPLICATE_NOTE_THRESHOLD = 0.85; // similarity score 0-1
const OUTCOME_BURST_WINDOW_MINUTES = 30;
const OUTCOME_BURST_COUNT = 5;
const BULK_EDIT_WINDOW_MINUTES = 10;
const BULK_EDIT_COUNT = 15;
const WORKING_HOURS = { start: 8, end: 21 }; // 8am - 9pm

const FRAUD_TIMEZONE = process.env.FRAUD_TIMEZONE || 'Asia/Kolkata';

// Hour of day (0-23) in the team's timezone, not the server's
function hourInTimezone(date) {
  const h = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    timeZone: FRAUD_TIMEZONE,
  }).format(date);
  return Number(h) % 24;
}

async function raiseFlag({ userId, leadId, interactionId, rule, severity, meta }) {
  const flag = await FraudFlag.create({ userId, leadId, interactionId, rule, severity, meta });

  try {
    const user = await User.findById(userId);
    const io = getIO();
    if (user?.reportsTo) io.to(rooms.team(user.reportsTo)).emit('fraud:flagRaised', flag);
    io.to(rooms.global()).emit('fraud:flagRaised', flag);
  } catch (err) {
    // Socket may not be initialised in some contexts (e.g. tests, cron jobs)
    console.warn('[fraudDetection] Could not emit fraud:flagRaised:', err.message);
  }

  return flag;
}

/**
 * Runs all real-time rules against a freshly logged interaction.
 * Called from interaction.controller.js right after creation.
 */
async function evaluateInteraction(interaction) {
  const { handledBy, leadId, secondsOnScreen, notes, date } = interaction;

  // Rule: Too-fast logging
  if (secondsOnScreen != null && secondsOnScreen < FRAUD_FAST_LOG_SECONDS) {
    await raiseFlag({
      userId: handledBy,
      leadId,
      interactionId: interaction._id,
      rule: 'too_fast_logging',
      severity: 'low',
      meta: { secondsOnScreen },
    });
  }

  // Rule: Odd-hour activity
    const hour = hourInTimezone(new Date(date || Date.now()));
  if (hour < WORKING_HOURS.start || hour >= WORKING_HOURS.end) {
    await raiseFlag({
      userId: handledBy,
      leadId,
      interactionId: interaction._id,
      rule: 'odd_hour_activity',
      severity: 'low',
      meta: { hour },
    });
  }

  // Rule: Duplicate note text across leads by the same BDE
  if (notes && notes.trim().length > 0) {
    const recent = await Interaction.find({ handledBy, _id: { $ne: interaction._id } })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('notes leadId');

    const match = recent.find(
      (r) =>
        r.notes &&
        String(r.leadId) !== String(leadId) &&
        stringSimilarity.compareTwoStrings(r.notes, notes) >= DUPLICATE_NOTE_THRESHOLD
    );

    if (match) {
      await raiseFlag({
        userId: handledBy,
        leadId,
        interactionId: interaction._id,
        rule: 'duplicate_note_text',
        severity: 'medium',
        meta: { matchedInteractionId: match._id },
      });
    }
  }

  // Rule: Outcome burst (many Not Interested / No Response in a short window)
  if (['Not Interested', 'No Response'].includes(interaction.outcome)) {
    const windowStart = new Date(Date.now() - OUTCOME_BURST_WINDOW_MINUTES * 60 * 1000);
    const count = await Interaction.countDocuments({
      handledBy,
      outcome: { $in: ['Not Interested', 'No Response'] },
      createdAt: { $gte: windowStart },
    });

    if (count >= OUTCOME_BURST_COUNT) {
      await raiseFlag({
        userId: handledBy,
        leadId,
        interactionId: interaction._id,
        rule: 'outcome_burst',
        severity: 'medium',
        meta: { count, windowMinutes: OUTCOME_BURST_WINDOW_MINUTES },
      });
    }
  }
}

/**
 * Rule: Bulk edit spike - call this from lead.controller.js bulk-status/bulk-assign endpoints.
 */
async function evaluateBulkEdit(userId, editCount) {
  if (editCount >= BULK_EDIT_COUNT) {
    await raiseFlag({
      userId,
      rule: 'bulk_edit_spike',
      severity: 'high',
      meta: { editCount, windowMinutes: BULK_EDIT_WINDOW_MINUTES },
    });
  }
}

/**
 * Rule: Stale lead - run daily via jobs/staleLeadChecker.job.js
 */
async function evaluateStaleLeads() {
  const cutoff = new Date(Date.now() - STALE_LEAD_DAYS * 24 * 60 * 60 * 1000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const inProgressStatuses = [
    'Attempted Contact',
    'Contacted',
    'Interested',
    'Demo/Visit Scheduled',
    'Visited',
    'Negotiation',
  ];

  const staleLeads = await Lead.find({
    status: { $in: inProgressStatuses },
    assignedTo: { $ne: null }, // a flag needs a person to attach to
    $and: [
      { $or: [{ lastContactedAt: { $lte: cutoff } }, { lastContactedAt: null }] },
      // A lead whose next follow-up is still in the future is on schedule, not stale
      { $or: [{ nextFollowUpDate: null }, { nextFollowUpDate: { $lt: startOfToday } }] },
    ],
  });

  let raised = 0;
  for (const lead of staleLeads) {
    // One open flag per lead is enough; don't repeat it every night
    const alreadyOpen = await FraudFlag.exists({ leadId: lead._id, rule: 'stale_lead', status: 'open' });
    if (alreadyOpen) continue;

    const days = lead.lastContactedAt
      ? Math.floor((Date.now() - lead.lastContactedAt.getTime()) / 86400000)
      : STALE_LEAD_DAYS;

    await raiseFlag({
      userId: lead.assignedTo,
      leadId: lead._id,
      rule: 'stale_lead',
      severity: 'medium',
      meta: { daysSinceContact: days },
    });
    raised += 1;
  }

  return raised;
}

module.exports = {
  evaluateInteraction,
  evaluateBulkEdit,
  evaluateStaleLeads,
  raiseFlag,
  hourInTimezone,
  WORKING_HOURS,
};