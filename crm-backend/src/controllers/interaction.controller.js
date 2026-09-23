const Interaction = require('../models/Interaction');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { validateInteractionInput } = require('../validators/interaction.validator');
const { success, error } = require('../utils/apiResponse');
const { evaluateInteraction } = require('../services/fraudDetection.service');
const { getIO, rooms } = require('../config/socket');
const { leadInScope } = require('../utils/leadScope');
const { STEP_TYPES, computeNextFollowUp } = require('../services/followUp.service');
const fs = require('fs');

// Deletes files multer already wrote to disk when the request ends up rejected
function removeUploadedFiles(files = []) {
  files.forEach((f) => fs.unlink(f.path, () => {}));
}

function todayString() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// true if the given follow-up date is before today (today itself is allowed)
function isPastDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10) < todayString();
  }
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d < startOfDay(new Date());
}

const OUTCOME_TO_STATUS = {
  'Interested': 'Interested',
  'Demo Booked': 'Demo/Visit Scheduled',
  'Converted': 'Converted',
  'Not Interested': 'Lost',
};

const CLOSED_STATUSES = ['Converted', 'Lost'];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function recalculateStreak(userId) {
  const user = await User.findById(userId).select('dailyTarget stats');
  if (!user) return;

  const since = new Date();
  since.setDate(since.getDate() - 120);

  const dailyCounts = await Interaction.aggregate([
    { $match: { handledBy: user._id, date: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const completedDays = new Set(
    dailyCounts.filter((d) => d.count >= user.dailyTarget).map((d) => d._id)
  );

  let currentStreak = 0;
  const cursor = startOfDay(new Date());
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (completedDays.has(key)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (key === new Date().toISOString().slice(0, 10)) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDays = [...completedDays].sort();
  let longestStreak = 0;
  let running = 0;
  let prevDate = null;
  for (const dayStr of sortedDays) {
    const day = new Date(dayStr);
    if (prevDate && (day - prevDate) / 86400000 === 1) {
      running += 1;
    } else {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
    prevDate = day;
  }
  longestStreak = Math.max(longestStreak, user.stats.longestStreak || 0, currentStreak);

  await User.findByIdAndUpdate(userId, {
    'stats.currentStreak': currentStreak,
    'stats.longestStreak': longestStreak,
  });
}

exports.createInteraction = async (req, res) => {
  const files = req.files || [];
  try {
    const { valid, errors } = validateInteractionInput(req.body);
    if (!valid) {
      removeUploadedFiles(files);
      return error(res, errors.join(', '), 422);
    }

    // A manual follow-up date can't be in the past (today is fine)
    if (req.body.nextFollowUpDate) {
      if (Number.isNaN(new Date(req.body.nextFollowUpDate).getTime())) {
        removeUploadedFiles(files);
        return error(res, 'Follow-up date is not valid', 422);
      }
      if (isPastDate(req.body.nextFollowUpDate)) {
        removeUploadedFiles(files);
        return error(res, 'Follow-up date cannot be in the past', 422);
      }
    }

    const { leadId, type } = req.body;

    const priorCount = await Interaction.countDocuments({ leadId, type });

    // Sequence bookkeeping (calls, visits and demos all count as steps)
    const isStep = STEP_TYPES.includes(type);
    const priorSteps = isStep
      ? await Interaction.countDocuments({ leadId, type: { $in: STEP_TYPES } })
      : 0;
    const stepNumber = priorSteps + 1;
    const firstStep =
      isStep && priorSteps > 0
        ? await Interaction.findOne({ leadId, type: { $in: STEP_TYPES } }).sort({ date: 1 }).select('date')
        : null;

    const interaction = await Interaction.create({
      ...req.body,
      handledBy: req.user._id,
      attemptNumber: priorCount + 1,
      date: req.body.date || new Date(),
      attachments: files.map((file) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        uploadedAt: new Date(),
      })),
    });

    const newStatus = OUTCOME_TO_STATUS[interaction.outcome]
      || (priorCount === 0 ? 'Attempted Contact' : 'Contacted');

    const leadUpdate = { lastContactedAt: new Date(), status: newStatus };
    const followUp = { mode: 'none', nextFollowUpDate: null, closedBySequence: false };

    if (CLOSED_STATUSES.includes(newStatus)) {
      leadUpdate.nextFollowUpDate = null;
      leadUpdate.followUpMode = 'none';
      if (isStep) leadUpdate.followUpStep = stepNumber;
    } else if (isStep) {
      leadUpdate.followUpStep = stepNumber;

      if (interaction.nextFollowUpDate) {
        leadUpdate.nextFollowUpDate = interaction.nextFollowUpDate;
        leadUpdate.followUpMode = 'manual';
        followUp.mode = 'manual';
        followUp.nextFollowUpDate = interaction.nextFollowUpDate;
      } else {
        const auto = computeNextFollowUp({
          stepNumber,
          firstContactAt: firstStep?.date || interaction.date,
        });

        if (auto.sequenceComplete) {
          leadUpdate.status = 'Lost';
          leadUpdate.nextFollowUpDate = null;
          leadUpdate.followUpMode = 'none';
          followUp.closedBySequence = true;
        } else {
          leadUpdate.nextFollowUpDate = auto.date;
          leadUpdate.followUpMode = 'auto';
          followUp.mode = 'auto';
          followUp.nextFollowUpDate = auto.date;
        }
      }
    } else if (interaction.nextFollowUpDate) {
      leadUpdate.nextFollowUpDate = interaction.nextFollowUpDate;
      leadUpdate.followUpMode = 'manual';
    }

        // The follow-up lives on the calendar of whoever logged this call/visit.
    // When the sequence is cleared (closed / converted), nobody owns it.
    if (leadUpdate.nextFollowUpDate) {
      leadUpdate.followUpOwner = req.user._id;
    } else if ('nextFollowUpDate' in leadUpdate) {
      leadUpdate.followUpOwner = null;
    }
    const lead = await Lead.findByIdAndUpdate(leadId, leadUpdate, { new: true });

    const statInc = {};
    if (type === 'call') statInc['stats.callsMade'] = 1;
    if (type === 'visit' || type === 'demo') statInc['stats.visitsMade'] = 1;
    if (interaction.outcome === 'Converted') statInc['stats.conversions'] = 1;
    if (Object.keys(statInc).length) {
      await User.findByIdAndUpdate(req.user._id, { $inc: statInc });
    }

    await evaluateInteraction(interaction);
    await recalculateStreak(req.user._id);

    const io = getIO();
    const targetRoom = lead?.assignedTeamLead ? rooms.team(lead.assignedTeamLead) : rooms.global();
    io.to(targetRoom).emit('interaction:created', { interaction, lead });
    io.to(rooms.global()).emit('interaction:created', { interaction, lead });

    if (req.audit) await req.audit('interaction.created', 'interactions', interaction._id, null, interaction);

    return success(res, { interaction, lead, followUp }, 'Interaction logged', 201);
  } catch (err) {
    removeUploadedFiles(files);
    return error(res, err.message, 500);
  }
};

exports.getInteractionsForLead = async (req, res) => {
  try {
    const interactions = await Interaction.find({ leadId: req.params.leadId })
      .populate('handledBy', 'name')
      .sort({ date: -1 });
    return success(res, interactions);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateInteraction = async (req, res) => {
  try {
    const previous = await Interaction.findById(req.params.id);
    if (!previous) return error(res, 'Interaction not found', 404);

    const updated = await Interaction.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.audit) await req.audit('interaction.updated', 'interactions', updated._id, previous, updated);

    return success(res, updated, 'Interaction updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// New (Section 4.4 / 5.10): attach files ("visiting card photo, pricing
// PDF, etc.") to an existing interaction. Scope-checked via the parent
// Lead, since interactions don't carry ownership info directly.
exports.uploadAttachments = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    if (!interaction) return error(res, 'Interaction not found', 404);

    const lead = await Lead.findById(interaction.leadId);
    if (!lead || !leadInScope(lead, req.scope)) {
      return error(res, 'Forbidden: this interaction is not in your scope', 403);
    }

    if (!req.files?.length) {
      return error(res, 'No files uploaded', 400);
    }

    const newAttachments = req.files.map((file) => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    }));

    interaction.attachments.push(...newAttachments);
    await interaction.save();

    if (req.audit) {
      await req.audit('interaction.attachmentsAdded', 'interactions', interaction._id, null, newAttachments);
    }

    return success(res, interaction, 'Attachment(s) uploaded', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
