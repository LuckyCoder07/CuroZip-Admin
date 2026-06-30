const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { smartQuery } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET all customers with filters
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: re }, { phone: re }, { email: re }];
    }
    if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const customers = await smartQuery(Customer, filter, { sort: { createdAt: -1 } });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET customer by ID with full order history
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    const orders = await smartQuery(Order, {
      $or: [
        { 'pickup.phone': customer.phone },
        { 'delivery.phone': customer.phone }
      ]
    });
    
    // Convert mongoose doc to plain object to attach orders
    const customerObj = customer.toObject();
    customerObj.orders = orders;
    
    res.json(customerObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE soft delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deactivated', customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET customer orders
router.get('/:id/orders', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const orders = await smartQuery(Order, {
      $or: [
        { 'pickup.phone': customer.phone },
        { 'delivery.phone': customer.phone }
      ]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
