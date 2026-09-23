const express = require('express');
const router = express.Router();
const StateCity = require('../models/StateCity');
const authMiddleware = require('../middlewares/auth.middleware');
const { success, error } = require('../utils/apiResponse');

// Serves the static State-City reference data (Section 6/11), read-only
router.get('/states-cities', authMiddleware, async (req, res) => {
  try {
    const data = await StateCity.find();
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
