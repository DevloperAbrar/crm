const Lead = require('../models/Lead');

function validateLeadInput(body) {
  const errors = [];

  if (!body.businessName || !body.businessName.trim()) {
    errors.push('businessName is required');
  }
  if (!body.categoryId) {
    errors.push('categoryId is required');
  }
  if (body.status && !Lead.STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${Lead.STATUSES.join(', ')}`);
  }
  if (body.phones && !Array.isArray(body.phones)) {
    errors.push('phones must be an array of strings');
  }

  return { valid: errors.length === 0, errors };
}

// Partial-update validation: only checks fields that are actually present.
function validateLeadUpdate(body) {
  const errors = [];

  if ('businessName' in body && (!body.businessName || !String(body.businessName).trim())) {
    errors.push('businessName cannot be empty');
  }
  if ('categoryId' in body && !body.categoryId) {
    errors.push('categoryId cannot be empty');
  }
  if (body.status && !Lead.STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${Lead.STATUSES.join(', ')}`);
  }
  if ('phones' in body && !Array.isArray(body.phones)) {
    errors.push('phones must be an array of strings');
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('email is not a valid email address');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateLeadInput, validateLeadUpdate };