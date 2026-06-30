const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { smartQuery } = require('../config/db');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const departments = await smartQuery(Department, { isActive: true });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requireRole('super_admin'), async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Department deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
