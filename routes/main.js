const express = require('express');
const router = express.Router();
const controller = require('../controller/mainController');

router.get('/', controller.getMain);

module.exports = router;
