const express = require('express');
const router = express.Router();
const db = require('../db');

router.use((req, res, next) => {
  const authenticate = req.app.get('authenticate');
  authenticate(req, res, next);
});

router.get('/', async (req, res) => {
  const rooms = await db.prepare('SELECT * FROM rooms').all();
  res.json(rooms);
});

module.exports = router;
