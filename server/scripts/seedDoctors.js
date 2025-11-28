const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const doctors = [
  {
    name: 'Sarah Johnson',
    email: 'dr.sarah@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'General Medicine',
    phone: '+1234567890',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Michael Chen',
    email: 'dr.chen@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Cardiology',
    phone: '+1234567891',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Emily Rodriguez',
    email: 'dr.rodriguez@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Pediatrics',
    phone: '+1234567892',
    isActive: true,
    isVerified: true
  },
  {
    name: 'David Thompson',
    email: 'dr.thompson@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Orthopedics',
    phone: '+1234567893',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Lisa Anderson',
    email: 'dr.anderson@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Dermatology',
    phone: '+1234567894',
    isActive: true,
    isVerified: true
  },
  {
    name: 'James Wilson',
    email: 'dr.wilson@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Neurology',
    phone: '+1234567895',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Maria Garcia',
    email: 'dr.garcia@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Obstetrics & Gynecology',
    phone: '+1234567896',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Robert Lee',
    email: 'dr.lee@healthlink.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Psychiatry',
    phone: '+1234567897',
    isActive: true,
    isVerified: true
  }
];

const seedDoctors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    // Check if doctors already exist
    const existingDoctors = await User.find({ role: 'doctor' });
    
    if (existingDoctors.length > 0) {
      console.log(`Found ${existingDoctors.length} existing doctors in the database.`);
      console.log('Skipping seed to avoid duplicates.');
      process.exit(0);
    }

    // Create doctors
    console.log('Seeding doctors...');
    
    for (const doctorData of doctors) {
      const existingUser = await User.findOne({ email: doctorData.email });
      
      if (!existingUser) {
        const doctor = new User(doctorData);
        await doctor.save();
        console.log(`✓ Created doctor: ${doctorData.name} (${doctorData.specialization})`);
      } else {
        console.log(`- Skipped ${doctorData.name} (already exists)`);
      }
    }

    console.log('\n✓ Doctors seeded successfully!');
    console.log(`Total doctors in database: ${await User.countDocuments({ role: 'doctor' })}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

seedDoctors();
