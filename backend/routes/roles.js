const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const { smartQuery } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const seedDefaultRoles = async () => {
  try {
    const count = await Role.countDocuments();
    if (count === 0) {
      const defaultRoles = [
        { name:"Super Admin", slug:"super_admin", isSystemRole:true, permissions:["all"] },
        { name:"Hub Manager", slug:"hub_manager", isSystemRole:true, permissions:["view_hub_orders","assign_vendor","assign_partner","update_status","manage_partners"] },
        { name:"Delivery Partner", slug:"delivery_partner", isSystemRole:true, permissions:["view_assigned_orders","update_delivery_status"] }
      ];
      await Role.insertMany(defaultRoles);
      console.log('[DB: test] Seeded 3 default roles');
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};
// Seed default roles when this route file is initialized (which happens when server starts)
seedDefaultRoles();

router.get('/', async (req, res) => {
  try {
    const roles = await smartQuery(Role, {}, { sort: { createdAt: 1 } });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const updateData = { name, description, permissions };
    // Optionally update slug if name changes, but usually slugs are immutable. We will keep it simple.
    
    const role = await Role.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.isSystemRole) {
      return res.status(403).json({ message: 'System roles cannot be deleted' });
    }
    
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
