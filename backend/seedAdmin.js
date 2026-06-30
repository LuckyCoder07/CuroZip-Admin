require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Determine which URI to connect to. In config/db.js it connects to MAIN then TEST if needed.
    // For simplicity, just connect to TEST since smartQuery uses fallback. Actually, let's connect to TEST.
    const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI_TEST || "mongodb+srv://curozip_db_user:curozip_dev123@mvp-development.vb9onwp.mongodb.net/test";
    
    await mongoose.connect(MONGODB_TEST_URI);
    console.log('Connected to MongoDB TEST');

    const email = 'admin@curozip.com';
    const password = 'Admin@123';
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('Admin user already exists. Resetting password just in case...');
      user.passwordHash = await bcrypt.hash(password, 10);
      user.isActive = true;
      user.role = 'super_admin';
      await user.save();
      console.log('Admin user updated successfully.');
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      user = new User({
        name: 'Super Admin',
        email,
        phone: '1234567890',
        passwordHash,
        role: 'super_admin',
        isActive: true,
      });
      await user.save();
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
