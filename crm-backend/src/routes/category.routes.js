const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const auditLogger = require('../middlewares/auditLogger.middleware');

router.use(authMiddleware, auditLogger);

router.get('/', categoryController.listCategories);
router.post('/', roleMiddleware('founder'), categoryController.createCategory);
router.put('/:id', roleMiddleware('founder'), categoryController.updateCategory);

module.exports = router;
