const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { smartQuery } = require('../config/db');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const vendors = await smartQuery(Vendor, filter);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/by-route', async (req, res) => {
  try {
    const { fromCity, toCity } = req.query;
    const vendors = await smartQuery(Vendor, {
      isActive: true,
      'operatingRoutes.fromCity': fromCity,
      'operatingRoutes.toCity': toCity
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requireRole('super_admin'), async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    await Vendor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Vendor deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
