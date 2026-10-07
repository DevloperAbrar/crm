const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const territoryMiddleware = require('../middlewares/territory.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');

router.use(authMiddleware, territoryMiddleware, auditLogger);

router.get('/', leadController.listLeads);
router.post('/', leadController.createLead);
router.get('/ids', roleMiddleware('founder', 'team_lead'), leadController.listLeadIds);
router.get('/duplicates', roleMiddleware('founder', 'team_lead'), leadController.findDuplicateGroups);
router.get('/:id', leadController.getLeadProfile);
router.put('/:id', leadController.updateLead);
router.delete('/:id', roleMiddleware('founder', 'team_lead'), leadController.deleteLead);
router.post('/bulk-assign', roleMiddleware('founder', 'team_lead'), leadController.bulkAssign);
router.post('/bulk-status', roleMiddleware('founder', 'team_lead'), leadController.bulkStatus);
router.post('/bulk-tag', roleMiddleware('founder', 'team_lead'), leadController.bulkTag);
router.post('/merge-duplicates', roleMiddleware('founder', 'team_lead'), leadController.mergeDuplicates);

module.exports = router;