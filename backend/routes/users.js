const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { smartQuery } = require('../config/db');

router.use(authenticateToken);

// GET /api/users — supports ?role=, ?hubId=, ?isActive=, ?search=
router.get('/', requireRole('super_admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role)     filter.role   = req.query.role;
    if (req.query.hubId)    filter.hubId  = req.query.hubId;
    if (req.query.isActive !== undefined)
      filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const users = await smartQuery(User, filter, { select: '-passwordHash', populate: { path: 'hubId', select: 'name city' } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// POST /api/users
router.post('/', requireRole('super_admin'), async (req, res) => {
  try {
    const { name, email, phone, password, role, hubId, city } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, passwordHash, role, hubId, city });
    await user.save();
    res.status(201).json({ message: 'User created successfully', userId: user._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/users/:id
router.put('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/by-hub/:hubId
router.get('/by-hub/:hubId', async (req, res) => {
  try {
    const users = await smartQuery(User, { hubId: req.params.hubId, isActive: true }, { select: '-passwordHash' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/delivery-partners/:hubId
router.get('/delivery-partners/:hubId', async (req, res) => {
  try {
    const partners = await smartQuery(User, { hubId: req.params.hubId, role: 'delivery_partner', isActive: true }, { select: '-passwordHash' });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/users/:id/reset-password
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If currentPassword provided, verify it
    if (currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
