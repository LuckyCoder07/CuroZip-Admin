const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Hub = require('../models/Hub');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const { authenticateToken } = require('../middleware/auth');
const { smartCount, smartAggregate } = require('../config/db');

router.use(authenticateToken);

router.get('/overview', async (req, res) => {
  try {
    const totalOrders = await smartCount(Order, {});
    const activeOrders = await smartCount(Order, { status: { $nin: ['Delivered', 'Failed / Returned'] } });
    const deliveredOrders = await smartCount(Order, { status: 'Delivered' });
    const totalHubs = await smartCount(Hub, { isActive: true });
    const activePartners = await smartCount(User, { role: 'delivery_partner', isActive: true });
    const totalCustomers = await smartCount(Customer, { isActive: true });
    const totalVendors = await smartCount(Vendor, { isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysRevenueResult = await smartAggregate(Order, [
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todaysRevenue = todaysRevenueResult.length > 0 ? todaysRevenueResult[0].total : 0;
    
    const totalRevenueResult = await smartAggregate(Order, [
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    
    res.json({ 
      totalOrders, activeOrders, deliveredOrders, todaysRevenue,
      totalHubs, activePartners, totalRevenue, totalCustomers, totalVendors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders-by-status', async (req, res) => {
  try {
    const data = await smartAggregate(Order, [
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json(data.map(d => ({ name: d._id, value: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders-by-city', async (req, res) => {
  try {
    const data = await smartAggregate(Order, [
      { $group: { _id: '$delivery.city', count: { $sum: 1 } } }
    ]);
    res.json(data.map(d => ({ city: d._id, count: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
