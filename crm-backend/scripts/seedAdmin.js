const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User'); 

const seedSuperAdmin = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:24017/campussafar-crm';
        
        // Removed deprecated useNewUrlParser and useUnifiedTopology options
        await mongoose.connect(mongoURI);
        console.log('Successfully connected to MongoDB.');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@campussafar.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Campussafar@2026';

        // 1. DYNAMIC ENUM RESOLUTION: Detect what your User schema actually expects for the highest role
        const roleSchemaType = User.schema.path('role');
        let targetRole = 'Founder'; // fallback

        if (roleSchemaType && roleSchemaType.enumValues && roleSchemaType.enumValues.length > 0) {
            const validRoles = roleSchemaType.enumValues;
            console.log(`ℹ️ System detected the following valid roles in your Schema: ${JSON.stringify(validRoles)}`);
            
            // Look for matching strings (case-insensitive variants)
            if (validRoles.includes('Founder')) targetRole = 'Founder';
            else if (validRoles.includes('founder')) targetRole = 'founder';
            else if (validRoles.includes('Admin')) targetRole = 'Admin';
            else if (validRoles.includes('admin')) targetRole = 'admin';
            else if (validRoles.includes('SuperAdmin')) targetRole = 'SuperAdmin';
            else if (validRoles.includes('superadmin')) targetRole = 'superadmin';
            else {
                // If it's something entirely custom, use the first role in the array list
                targetRole = validRoles[0];
            }
        }
        
        console.log(`🚀 Using role identifier: "${targetRole}" to build your primary user...`);

        // 2. Check if a top-tier user already exists with this targeted role string
        const existingAdmin = await User.findOne({ role: targetRole });
        if (existingAdmin) {
            console.log(`Seed cancelled: A account with the role "${targetRole}" already exists (${existingAdmin.email}).`);
            process.exit(0);
        }

        // 3. Encrypt password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        // 4. Construct payload
        const superAdmin = new User({
            name: 'Super Admin',
            email: adminEmail.toLowerCase(),
            passwordHash: passwordHash,
            role: targetRole, 
            reportsTo: null,
            assignedStates: [],
            assignedCities: [],
            assignedCategories: [],
            dailyTarget: 0,
            weeklyTarget: 0,
            trustScore: 100
        });

        await superAdmin.save();
        
        console.log('----------------------------------------------------');
        console.log('🎉 Super Admin Seeded Successfully!');
        console.log(`📧 Registered Email: ${adminEmail}`);
        console.log(`🔒 Active Password: ${adminPassword}`);
        console.log(`🛡️ Confirmed Role: ${targetRole}`);
        console.log('----------------------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Super Admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
