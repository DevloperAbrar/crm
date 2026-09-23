const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/me', calendarController.myCalendar);
router.get('/team', roleMiddleware('team_lead', 'founder'), calendarController.teamCalendar);
router.get('/streak/:userId', calendarController.getStreak);

module.exports = router;
