const express = require('express');
const router = express.Router();
const Hub = require('../models/Hub');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { smartQuery, smartFindById, smartFindByIdAndUpdate } = require('../config/db');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const hubs = await smartQuery(Hub, filter, { populate: { path: 'managerId', select: 'name email' } });
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hub = await smartFindById(Hub, req.params.id, { path: 'managerId', select: 'name email' });
    if (!hub) return res.status(404).json({ message: 'Hub not found' });
    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requireRole('super_admin'), async (req, res) => {
  try {
    const hub = new Hub(req.body);
    await hub.save();
    res.status(201).json(hub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    const hub = await smartFindByIdAndUpdate(Hub, req.params.id, req.body);
    res.json(hub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    await smartFindByIdAndUpdate(Hub, req.params.id, { isActive: false });
    res.json({ message: 'Hub deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
