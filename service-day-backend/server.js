import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Import local models (Must include .js extension!)
import Activity from './models/Activity.js';
import Employee from './models/Employee.js';

const app = express();
const PORT = 3000;

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// ==========================================
// 2. DATABASE CONFIGURATION
// ==========================================
const mongoURI = 'mongodb://127.0.0.1:27017/serviceDayDB';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

app.post('/api/employees', async (req, res) => {
    try {
        // Automatically generate a unique ID for the new user
        if (!req.body.id) {
            req.body.id = Date.now();
        }

        const newEmployee = new Employee(req.body);
        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error('❌ Mongoose Validation Error (Employee):', error.message);
        res.status(400).json({ message: 'Validation Failed', details: error.message });
    }
});

app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        if (!email || !email.includes('@') || !email.toLowerCase().endsWith('.com')) {
            return res.status(400).json({ message: "Invalid email format. Must end with .com" });
        }
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching employees' });
    }
});

// This is the correct route for showing participant NAMES
app.get('/api/activities/:id/participants', async (req, res) => {
    try {
        const activityId = Number(req.params.id);
        const activity = await Activity.findOne({ id: activityId });

        if (!activity || !activity.registeredStaffIds || activity.registeredStaffIds.length === 0) {
            return res.json([]);
        }

        // Find all real employees from your MongoDB Employee collection
        const participants = await Employee.find({
            id: { $in: activity.registeredStaffIds }
        });

        res.json(participants);
    } catch (error) {
        console.error('Error fetching real participants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Get all activities
app.get('/api/activities', async (req, res) => {
    try {
        const activities = await Activity.find();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching activities' });
    }
});

// Get a single activity by ID
app.get('/api/activities/:id', async (req, res) => {
    try {
        // 🌟 CRITICAL: Use Number() to match the ID type in MongoDB
        const activityId = Number(req.params.id);
        const activity = await Activity.findOne({ id: activityId });

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new activity
app.post('/api/activities', async (req, res) => {
    try {
        // 🌟 THE FIX: If Angular forgot to send an ID, the backend creates a unique one!
        // We use Date.now() because it generates a unique timestamp number every millisecond.
        if (!req.body.id) {
            req.body.id = Date.now();
        }

        const newActivity = new Activity(req.body);
        const savedActivity = await newActivity.save();
        res.status(201).json(savedActivity);
    } catch (error) {
        console.error('❌ Mongoose Validation Error:', error.message);
        res.status(400).json({ message: 'Validation Failed', details: error.message });
    }
});

// Update an activity (Edit / Save Schedule)
app.put('/api/activities/:id', async (req, res) => {
    try {
        const updatedActivity = await Activity.findOneAndUpdate(
            { id: Number(req.params.id) },
            req.body,
            { returnDocument: 'after' } // ✅ The modern replacement
        );
        res.json(updatedActivity);
    } catch (error) {
        res.status(400).json({ error: 'Error updating activity' });
    }
});

// Delete an activity
app.delete('/api/activities/:id', async (req, res) => {
    try {
        await Activity.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Activity deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting activity' });
    }
});


// ==========================================
// 4. API ROUTES (Registration Logic)
// ==========================================

// Register an employee for an activity
app.post('/api/activities/:id/register', async (req, res) => {
    try {
        const activityId = Number(req.params.id);
        const employeeId = Number(req.body.employeeId);

        // 🌟 DEBUG LOGS: Check your VS Code terminal for these!
        console.log(`\n--- 📥 Registration Request ---`);
        console.log(`Activity ID: ${activityId}`);
        console.log(`Employee ID: ${employeeId}`);

        const activity = await Activity.findOne({ id: activityId });

        if (!activity) {
            console.log('❌ Error: Activity not found in MongoDB');
            return res.status(404).json({ message: 'Activity not found' });
        }

        // 🌟 FIX 1: Initialize the array if it doesn't exist yet
        if (!activity.registeredStaffIds) {
            activity.registeredStaffIds = [];
        }

        // 🌟 FIX 2: Explicitly check for duplicate using Number comparison
        const isAlreadyIn = activity.registeredStaffIds.some(id => Number(id) === employeeId);

        if (!isAlreadyIn) {
            activity.registeredStaffIds.push(employeeId);

            // Manually update the slot count
            activity.registeredSlots = activity.registeredStaffIds.length;

            // 🌟 FIX 3: Force Mongoose to acknowledge the change
            activity.markModified('registeredStaffIds');

            await activity.save();
            console.log(`✅ Success: User ${employeeId} added to Activity ${activityId}`);
        } else {
            console.log(`⚠️ Note: User ${employeeId} was already registered.`);
        }

        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('🔥 Registration Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Cancel a registration
app.post('/api/activities/:id/cancel', async (req, res) => {
    try {
        const activityId = Number(req.params.id);
        const employeeId = Number(req.body.employeeId);

        const activity = await Activity.findOne({ id: activityId });

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        if (activity.registeredStaffIds) {
            // Remove the ID using a strict Number filter
            activity.registeredStaffIds = activity.registeredStaffIds.filter(
                id => Number(id) !== employeeId
            );

            activity.registeredSlots = activity.registeredStaffIds.length;

            activity.markModified('registeredStaffIds');
            await activity.save();
            console.log(`🗑️ Cancelled: User ${employeeId} removed from Activity ${activityId}`);
        }

        res.json({ message: 'Cancellation successful' });
    } catch (error) {
        console.error('Cancellation Error:', error);
        res.status(500).json({ error: 'Error cancelling registration' });
    }
});

// ==========================================
// 5. START ENGINE
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Service Day Backend is running on http://localhost:${PORT}`);
});