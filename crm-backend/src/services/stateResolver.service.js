const StateCity = require('../models/StateCity');

// Builds lookup tables once, then resolves state codes without more DB calls.
async function buildStateResolver() {
  const states = await StateCity.find().lean();
  const byCode = new Map();
  const byName = new Map();
  const cityMap = new Map(); // lower-case city -> Set of state codes

  for (const s of states) {
    byCode.set(s.stateCode.toLowerCase(), s.stateCode);
    byName.set(s.stateName.toLowerCase(), s.stateCode);
    for (const c of s.cities || []) {
      const key = String(c).trim().toLowerCase();
      if (!cityMap.has(key)) cityMap.set(key, new Set());
      cityMap.get(key).add(s.stateCode);
    }
  }

  const candidates = (city) => [...(cityMap.get(String(city || '').trim().toLowerCase()) || [])];

  return {
    candidates,
    // stateHint may be a code or a name from the import file; city is the fallback.
    resolve(city, stateHint) {
      if (stateHint) {
        const h = String(stateHint).trim().toLowerCase();
        const hit = byCode.get(h) || byName.get(h);
        if (hit) return hit;
      }
      const c = candidates(city);
      return c.length === 1 ? c[0] : null; // ambiguous or unknown -> leave blank
    },
  };
}

module.exports = { buildStateResolver };