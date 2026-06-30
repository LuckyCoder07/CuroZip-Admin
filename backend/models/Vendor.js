const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  vehicleType: {
    type: String,
    enum: ['Volvo Bus', 'Cargo Truck', 'Mini Van', 'Other'],
    required: true
  },
  operatingRoutes: [{
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    fromPincodes: [{ type: String }],
    toPincodes: [{ type: String }]
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
