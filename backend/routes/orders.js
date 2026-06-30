const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { smartQuery, smartCount, smartFindById, smartFindByIdAndUpdate } = require('../config/db');
const Hub = require('../models/Hub');

// Public route for tracking
router.get('/track/:trackingId', async (req, res) => {
  try {
    const order = await Order.findOne({ trackingId: req.params.trackingId })
      .select('trackingId status statusHistory pickup.city delivery.city createdAt')
      .populate('statusHistory.updatedBy', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// All routes below are protected
router.use(authenticateToken);

const generateTrackingId = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CZ${dateStr}`;
  const count = await smartCount(Order, { trackingId: new RegExp(`^${prefix}`) });
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const filter = {};

    // Text search across trackingId, customerName, customerPhone
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [{ trackingId: re }, { customerName: re }, { customerPhone: re }];
    }

    // Status — supports single value or comma-separated list
    if (req.query.status) {
      const statuses = req.query.status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) filter.status = statuses[0];
      else if (statuses.length > 1) filter.status = { $in: statuses };
    }

    // Hub filter — orders where pickup OR destination hub matches
    if (req.query.hubId) {
      filter.$or = [
        { pickupHubId: req.query.hubId },
        { destinationHubId: req.query.hubId },
      ];
    }

    // Date range
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to)   filter.createdAt.$lte = new Date(new Date(req.query.to).setHours(23, 59, 59, 999));
    }

    const options = {
      populate: [
        { path: 'pickupHubId', select: 'name city' },
        { path: 'destinationHubId', select: 'name city' },
        { path: 'assignedVendorId', select: 'name vehicleType' },
        { path: 'assignedPickupPartnerId', select: 'name phone' },
        { path: 'assignedDeliveryPartnerId', select: 'name phone' }
      ],
      sort: { createdAt: -1 },
      limit: 500
    };
    const orders = await smartQuery(Order, filter, options);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/hub/:hubId', async (req, res) => {
  try {
    const orders = await smartQuery(Order, {
      $or: [
        { pickupHubId: req.params.hubId },
        { destinationHubId: req.params.hubId }
      ]
    }, { populate: 'pickupHubId destinationHubId' });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await smartFindById(Order, req.params.id, [
      { path: 'pickupHubId', select: 'name city state' },
      { path: 'destinationHubId', select: 'name city state' },
      { path: 'assignedVendorId', select: 'name phone' },
      { path: 'assignedPickupPartnerId', select: 'name phone' },
      { path: 'assignedDeliveryPartnerId', select: 'name phone' },
      { path: 'statusHistory.updatedBy', select: 'name' }
    ]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const trackingId = await generateTrackingId();
    const orderData = { ...req.body, trackingId };
    
    let warning = null;
    if (orderData.pickup && orderData.pickup.pincode) {
      const pickupHubs = await smartQuery(Hub, { serviceablePincodes: orderData.pickup.pincode, isActive: true });
      if (pickupHubs.length > 0) {
        orderData.pickupHubId = pickupHubs[0]._id;
      } else {
        warning = `No hub found for pickup pincode ${orderData.pickup.pincode}`;
      }
    }
    
    if (orderData.delivery && orderData.delivery.pincode) {
      const deliveryHubs = await smartQuery(Hub, { serviceablePincodes: orderData.delivery.pincode, isActive: true });
      if (deliveryHubs.length > 0) {
        orderData.destinationHubId = deliveryHubs[0]._id;
      } else {
        warning = warning ? warning + `. No hub found for delivery pincode ${orderData.delivery.pincode}` : `No hub found for delivery pincode ${orderData.delivery.pincode}`;
      }
    }
    
    orderData.statusHistory = [{
      status: 'Booked',
      updatedBy: req.user ? req.user.id : null,
      updatedByName: req.user ? req.user.name : 'Admin',
      note: 'Order created by admin'
    }];
    
    const order = new Order(orderData);
    await order.save();
    
    const response = { order };
    if (warning) response.warning = warning;
    
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id/assign-vendor', requireRole('super_admin'), async (req, res) => {
  try {
    const { vendorId } = req.body;
    const order = await smartFindByIdAndUpdate(Order, req.params.id, {
      assignedVendorId: vendorId
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id/assign-pickup-partner', async (req, res) => {
  try {
    const { partnerId } = req.body;
    const order = await smartFindById(Order, req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.assignedPickupPartnerId = partnerId;
    order.status = 'Pickup Assigned';
    order.statusHistory.push({
      status: 'Pickup Assigned',
      updatedBy: req.user.id,
      updatedByName: req.user.name,
      note: 'Pickup partner assigned'
    });
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id/assign-delivery-partner', async (req, res) => {
  try {
    const { partnerId } = req.body;
    const order = await smartFindById(Order, req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.assignedDeliveryPartnerId = partnerId;
    order.status = 'Out for Delivery';
    order.statusHistory.push({
      status: 'Out for Delivery',
      updatedBy: req.user.id,
      updatedByName: req.user.name,
      note: 'Delivery partner assigned'
    });
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await smartFindById(Order, req.params.id);
    
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: req.user.id,
      updatedByName: req.user.name,
      note
    });
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
