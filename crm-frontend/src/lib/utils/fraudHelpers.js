// Must match PENALTY in crm-backend/src/services/trust.service.js
export const PENALTY = { low: 2, medium: 5, high: 10 };

export const RULES = {
  too_fast_logging: {
    label: 'Call logged too fast',
    help: 'The log form was open for only a few seconds, so the call may not have really happened.',
  },
  odd_hour_activity: {
    label: 'Activity outside working hours',
    help: 'A call or visit was logged outside 8 AM to 9 PM.',
  },
  duplicate_note_text: {
    label: 'Copy-pasted notes',
    help: 'The notes are almost identical to notes written on a different lead.',
  },
  outcome_burst: {
    label: 'Burst of negative outcomes',
    help: 'Many "Not Interested" or "No Response" logs in a short time.',
  },
  stale_lead: {
    label: 'Lead going stale',
    help: 'An in-progress lead has had no contact and its follow-up is overdue.',
  },
  bulk_edit_spike: {
    label: 'Large bulk edit',
    help: 'A large number of leads were changed in one action.',
  },
};

const RANK = { low: 1, medium: 2, high: 3 };

export function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function flagTime(flag) {
  return flag.interactionId?.date || flag.createdAt;
}

// One-line "what exactly happened" for a single flag
export function describeFlag(flag) {
  const m = flag.meta || {};
  switch (flag.rule) {
    case 'too_fast_logging':
      return `Logged after only ${m.secondsOnScreen ?? '?'} seconds`;
    case 'odd_hour_activity':
      return `Logged at ${new Date(flagTime(flag)).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    case 'duplicate_note_text':
      return "Notes match another lead's notes";
    case 'outcome_burst':
      return `${m.count} negative outcomes within ${m.windowMinutes} minutes`;
    case 'stale_lead':
      return `No contact for ${m.daysSinceContact} days`;
    case 'bulk_edit_spike':
      return `${m.editCount} leads changed at once`;
    default:
      return flag.rule.replace(/_/g, ' ');
  }
}

// Repeats of the same rule, for the same person and lead, become one group
// (flags arrive newest first, so the group order stays newest first)
export function groupFlags(flags) {
  const map = new Map();
  flags.forEach((f) => {
    const key = [f.userId?._id, f.leadId?._id || '-', f.rule].join('|');
    if (!map.has(key)) {
      map.set(key, { key, user: f.userId, lead: f.leadId, rule: f.rule, severity: f.severity, flags: [] });
    }
    const group = map.get(key);
    group.flags.push(f);
    if (RANK[f.severity] > RANK[group.severity]) group.severity = f.severity;
  });
  return [...map.values()];
}

// Trust points lost if the whole group is confirmed fraudulent
export function groupImpact(group) {
  return group.flags.reduce((sum, f) => sum + (PENALTY[f.severity] || 0), 0);
}