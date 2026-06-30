const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/settings — return all settings as key:value object
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.find({});
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/settings — upsert a setting by key
router.put('/', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ message: 'Key is required' });
  try {
    const setting = await Settings.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
