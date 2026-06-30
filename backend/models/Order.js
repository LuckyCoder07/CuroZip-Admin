const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  pickup: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  delivery: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  parcel: {
    weight: { type: Number, required: true },
    dimensions: {
      l: { type: Number, required: true },
      w: { type: Number, required: true },
      h: { type: Number, required: true }
    },
    description: { type: String, required: true },
    value: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['Booked', 'Pickup Assigned', 'Picked Up', 'In Transit', 'At Destination Hub', 'Out for Delivery', 'Delivered', 'Failed / Returned'],
    default: 'Booked'
  },
  pickupHubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  destinationHubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  assignedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  assignedPickupPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedDeliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  statusHistory: [{
    status: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String },
    note: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  amount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
