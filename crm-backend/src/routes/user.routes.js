const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');

router.use(authMiddleware, territoryMiddleware, auditLogger);

router.get('/', userController.listUsers);
router.post('/', roleMiddleware('founder', 'team_lead'), userController.createUser);
router.put('/:id', roleMiddleware('founder', 'team_lead'), userController.updateUser);
router.delete('/:id', roleMiddleware('founder', 'team_lead'), userController.deactivateUser);
router.put('/:id/reactivate', roleMiddleware('founder', 'team_lead'), userController.reactivateUser);
router.put('/:id/reassign-team', roleMiddleware('founder'), userController.reassignTeam);

module.exports = router;
