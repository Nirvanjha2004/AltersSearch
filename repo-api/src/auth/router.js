'use strict';

const express = require('express');
const { register, login, refresh, logout } = require('./handlers.js');

const router = express.Router();

router.use(express.json());

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/api/auth/refresh', refresh);
router.post('/api/auth/logout', logout);

module.exports = router;
