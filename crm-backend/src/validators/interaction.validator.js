const ALLOWED_TYPES = ['call', 'visit', 'demo', 'email'];
const ALLOWED_OUTCOMES = [
  'Interested',
  'Not Interested',
  'Call Back Later',
  'No Response',
  'Already Using Competitor',
  'Demo Booked',
  'Converted',
];

function validateInteractionInput(body) {
  const errors = [];

  if (!body.leadId) errors.push('leadId is required');
  if (!body.type || !ALLOWED_TYPES.includes(body.type)) {
    errors.push(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
  }
  if (!body.outcome || !ALLOWED_OUTCOMES.includes(body.outcome)) {
    errors.push(`outcome must be one of: ${ALLOWED_OUTCOMES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateInteractionInput };
