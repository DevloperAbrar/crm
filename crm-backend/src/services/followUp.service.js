// Follow-up cadence, counted in days from the FIRST contact (call/visit/demo).
// After step 1 -> +3 days, step 2 -> +7, step 3 -> +11, step 4 -> +16, step 5 -> +21.
// After step 6 (the day-21 follow-up) the sequence is complete and the lead is closed.
const SEQUENCE_DAYS = [3, 7, 11, 16, 21];

// Interaction types that count as a step in the sequence.
const STEP_TYPES = ['call', 'visit', 'demo'];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * stepNumber:     the step being logged now (1 = first contact).
 * firstContactAt: date of the first step; null/undefined when stepNumber is 1.
 */
function computeNextFollowUp({ stepNumber, firstContactAt, now = new Date() }) {
  if (stepNumber > SEQUENCE_DAYS.length) {
    return { date: null, sequenceComplete: true };
  }

  const target = startOfDay(firstContactAt || now);
  target.setDate(target.getDate() + SEQUENCE_DAYS[stepNumber - 1]);

  // Never schedule in the past (e.g. the BDE called late): earliest is tomorrow.
  const tomorrow = startOfDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return { date: target < tomorrow ? tomorrow : target, sequenceComplete: false };
}

module.exports = { SEQUENCE_DAYS, STEP_TYPES, computeNextFollowUp };