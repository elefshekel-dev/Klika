const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' });
  }

  const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const secret = req.app.get('jwtSecret');
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    secret,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
  });
});

router.get('/me', (req, res) => {
  const authenticate = req.app.get('authenticate');
  authenticate(req, res, async () => {
    const user = await db.prepare('SELECT id, username, role, name FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });
    res.json(user);
  });
});

module.exports = router;
