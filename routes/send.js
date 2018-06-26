const express = require('express');
const router = express.Router();
const stackOflowController = require('../controllers/stackOflowController');

/* POST from interactive button . */
router.post('/', stackOflowController.getAnswer);

module.exports = router;
