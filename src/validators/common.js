const { body } = require('express-validator');

// Rejects a body that is not a JSON object or that contains fields outside `allowed`.
// This blocks mass-assignment, e.g. a client trying to set "user" (the owner) or "_id".
const allowOnly = (allowed) =>
  body().custom((value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Request body must be a JSON object');
    }
    const unexpected = Object.keys(value).filter((k) => !allowed.includes(k));
    if (unexpected.length) {
      throw new Error(`Unexpected field(s): ${unexpected.join(', ')}`);
    }
    return true;
  });

module.exports = { allowOnly };
