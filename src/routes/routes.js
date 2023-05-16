const { Router } = require('express');
const User = require('../models/User');
const mongoose = require('mongoose');
const router = Router();


router.use(require('./AuthRoutes.js'));

router.use(require('./HomeRoutes.js'));

router.use(require('./Meli.js'));


module.exports = router;