const express = require('express');
const router = express.Router();
const ScoreController = require('../controllers/scoreController');

router.get('/:nit', ScoreController.getScore);

module.exports = router;