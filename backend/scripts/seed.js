require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hub = require('../models/Hub');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data (optional, but good for idempotency)
    await User.deleteMany({});
    await Hub.deleteMany({});
    await Vendor.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Create super_admin
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@curozip.com',
      phone: '9999999999',
      passwordHash: adminPasswordHash,
      role: 'super_admin'
    });
    console.log('Super Admin created');

    // Create Hubs
    const dibrugarhHub = await Hub.create({
      name: 'Dibrugarh Hub',
      email: 'dibrugarh@curozip.com',
      phone: '8888888881',
      address: 'Near Station, Dibrugarh',
      city: 'Dibrugarh',
      state: 'Assam',
      serviceablePincodes: ['786001', '786003', '786005'],
      managerId: admin._id
    });

    const guwahatiHub = await Hub.create({
      name: 'Guwahati Hub',
      email: 'guwahati@curozip.com',
      phone: '8888888882',
      address: 'Paltan Bazar, Guwahati',
      city: 'Guwahati',
      state: 'Assam',
      serviceablePincodes: ['781001', '781003', '781005'],
      managerId: admin._id
    });
    console.log('Hubs created');

    // Create Vendor
    const vendor = await Vendor.create({
      name: 'Assam Express Fleet',
      contactPerson: 'Rahul Sharma',
      phone: '7777777777',
      email: 'assam.express@example.com',
      vehicleType: 'Volvo Bus',
      operatingRoutes: [{
        fromCity: 'Dibrugarh',
        toCity: 'Guwahati',
        fromPincodes: ['786001', '786003', '786005'],
        toPincodes: ['781001', '781003', '781005']
      }]
    });
    console.log('Vendor created');

    // Create Sample Orders
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    await Order.create({
      trackingId: `CZ${dateStr}0001`,
      customerName: 'John Doe',
      customerPhone: '9876543210',
      pickup: { name: 'John Doe', phone: '9876543210', address: 'Dibrugarh University', city: 'Dibrugarh', pincode: '786001' },
      delivery: { name: 'Jane Smith', phone: '9876543211', address: 'GS Road', city: 'Guwahati', pincode: '781005' },
      parcel: { weight: 2.5, dimensions: { l: 30, w: 20, h: 10 }, description: 'Documents and Books', value: 5000 },
      status: 'In Transit',
      pickupHubId: dibrugarhHub._id,
      destinationHubId: guwahatiHub._id,
      assignedVendorId: vendor._id,
      amount: 250,
      statusHistory: [
        { status: 'Booked', updatedBy: admin._id, updatedByName: admin.name, note: 'Order booked' },
        { status: 'In Transit', updatedBy: admin._id, updatedByName: admin.name, note: 'Dispatched to destination' }
      ]
    });

    await Order.create({
      trackingId: `CZ${dateStr}0002`,
      customerName: 'Alice Johnson',
      customerPhone: '9876543212',
      pickup: { name: 'Alice Johnson', phone: '9876543212', address: 'Jalukbari', city: 'Guwahati', pincode: '781003' },
      delivery: { name: 'Bob Brown', phone: '9876543213', address: 'Boiragimoth', city: 'Dibrugarh', pincode: '786003' },
      parcel: { weight: 5.0, dimensions: { l: 40, w: 30, h: 20 }, description: 'Electronics', value: 15000 },
      status: 'Delivered',
      pickupHubId: guwahatiHub._id,
      destinationHubId: dibrugarhHub._id,
      amount: 450,
      statusHistory: [
        { status: 'Booked', updatedBy: admin._id, updatedByName: admin.name, note: 'Order booked' },
        { status: 'Delivered', updatedBy: admin._id, updatedByName: admin.name, note: 'Delivered successfully' }
      ]
    });
    console.log('Sample orders created');

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
