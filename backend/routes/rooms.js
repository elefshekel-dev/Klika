const express = require('express');
const router = express.Router();
const db = require('../db');

router.use((req, res, next) => {
  const authenticate = req.app.get('authenticate');
  authenticate(req, res, next);
});

router.get('/', async (req, res) => {
  // משרד פרטי is hidden from booking options (kept in DB for history)
  const rooms = await db.prepare("SELECT * FROM rooms WHERE name != 'משרד פרטי'").all();
  res.json(rooms);
});

module.exports = router;
