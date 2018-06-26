const express = require('express');
const router = express.Router();
const stackOflowController = require('../controllers/stackOflowController');

/* POST from command slash. */
router.post('/', stackOflowController.getQuestions);

module.exports = router;
