import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Import local models (Must include .js extension!)
import Activity from './models/Activity.js';
import Employee from './models/Employee.js';
import Notification from './models/Notification.js';
import Email from './models/Email.js';
import cron from 'node-cron';

const app = express();
const PORT = 3000;

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] // 🌟 Added PATCH for mark-as-read
}));
app.use(express.json());

// ==========================================
// 2. DATABASE CONFIGURATION
// ==========================================
const mongoURI = 'mongodb://127.0.0.1:27017/serviceDayDB';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

//create employee account
app.post('/api/employees', async (req, res) => {
    try {
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
        res.json(employees);
    } catch (error) {
        console.error("❌ ERROR FETCHING EMPLOYEES:", error.message);
        res.status(500).json({
            message: "Server failed to fetch employees",
            error: error.message
        });
    }
});

//activity management
app.get('/api/activities/:id/participants', async (req, res) => {
    try {
        const activityId = Number(req.params.id);
        const activity = await Activity.findOne({ id: activityId });

        if (!activity || !activity.registeredStaffIds || activity.registeredStaffIds.length === 0) {
            return res.json([]);
        }

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
            { returnDocument: 'after' }
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

        console.log(`\n--- 📥 Registration Request ---`);
        const activity = await Activity.findOne({ id: activityId });
        // 🌟 NEW: We must fetch the employee to get their email and name
        const employee = await Employee.findOne({ id: employeeId });

        if (!activity || !employee) {
            return res.status(404).json({ message: 'Activity or Employee not found' });
        }

        const alreadyRegisteredActivities = await Activity.find({
            id: { $ne: activityId }, // Ignore the activity they are currently trying to join
            registeredStaffIds: employeeId // Checks if their ID is sitting in ANY other activity's list
        });

        // If we found even one match, reject the registration instantly!
        if (alreadyRegisteredActivities.length > 0) {
            console.log(`⚠️ Blocked: User ${employeeId} is already registered for "${alreadyRegisteredActivities[0].title}".`);
            return res.status(400).json({
                error: `Limit Reached: You are already registered for "${alreadyRegisteredActivities[0].title}". You may only join one activity at a time. Please cancel your existing registration to switch activities.`
            });
        }

        if (!activity.registeredStaffIds) activity.registeredStaffIds = [];
        const isAlreadyIn = activity.registeredStaffIds.some(id => Number(id) === employeeId);

        if (!isAlreadyIn) {
            // 1. Save to MongoDB
            activity.registeredStaffIds.push(employeeId);
            activity.registeredSlots = activity.registeredStaffIds.length;
            activity.markModified('registeredStaffIds');
            await activity.save();
            console.log(`✅ Success: User ${employeeId} added to Activity ${activityId}`);

            // 2. Create the Notification
            const registrationAlert = new Notification({
                recipientId: employeeId,
                type: 'Registration',
                title: 'Activity Confirmed! 🎉',
                message: `You have successfully joined "${activity.title}". Get ready for ${activity.date || 'the event'}!`,
                activityId: activityId,
                isRead: false
            });
            await registrationAlert.save();

            // 🌟 3. NEW: GENERATE THE QR CODE URL
            // We turn your JSON payload into a secure URL-encoded string
            const qrPayload = JSON.stringify({ employeeId: employee.id, activityId: activity.id });
            const encodedPayload = encodeURIComponent(qrPayload);
            // This API instantly turns your text into a scannable image
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedPayload}`;

            // 🌟 4. NEW: DRAFT THE TICKET EMAIL
            const emailPayload = {
                to: employee.email,
                subject: `🎟️ Event Ticket & QR Code: ${activity.title}`,
                body: `
                    <div style="font-family: Arial; padding: 20px; border: 2px solid #0ea5e9; border-radius: 10px; max-width: 500px; text-align: center;">
                        <h2 style="color: #0ea5e9; margin-top: 0;">Registration Confirmed!</h2>
                        <p style="font-size: 16px; color: #334155;">Hello <strong>${employee.name || 'Volunteer'}</strong>,</p>
                        <p style="font-size: 16px; color: #334155;">You are officially registered for <strong>${activity.title}</strong>.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="font-size: 14px; font-weight: bold; color: #1e293b;">Present this QR code to the Admin at the event:</p>
                        
                        <img src="${qrImageUrl}" alt="Your Check-In QR Code" style="margin: 15px 0; border: 4px solid #f8fafc; border-radius: 8px;">
                        
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">This is an automated message from the Service Day System.</p>
                    </div>
                `
            };

            // 🌟 5. NEW: SEND VIA GOOGLE APPS SCRIPT
            const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwcq8FbZc6-m0o_Xk1ZmQKl6TdOULjZWPIx2AjmdwakjbP0AjzvByCvai3svE2xKaqq/exec";

            // SAFETY CHECK: Does this employee actually have an email?
            if (!employee.email) {
                console.error(`🚨 ERROR: Cannot send email! Employee ${employeeId} has no email address in the database.`);
            } else {
                try {
                    console.log(`⏳ Sending ticket to Google Apps Script for ${employee.email}...`);

                    const response = await fetch(googleScriptUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailPayload)
                    });

                    // Wait for Google to reply so we know it actually worked
                    const result = await response.text();
                    console.log(`✅ Google Script Reply:`, result);

                    // 🌟 6. SAVE TO EMAIL SCHEMA
                    const logEntry = new Email({
                        recipientEmail: employee.email,
                        subject: emailPayload.subject,
                        message: `QR Code Ticket sent for ${activity.title}`,
                        emailType: 'Registration', // Ensure this matches your schema (e.g., Registration, Ticket, Schedule)
                        activityId: activity.id
                    });

                    await logEntry.save();
                    console.log(`💾 Success: Email permanently logged in MongoDB Database!`);

                } catch (fetchError) {
                    console.error("🔥 CRITICAL FAIL: Node.js could not reach Google Apps Script:", fetchError);
                }
            }

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

        // 🌟 1. REMOVE FROM REGISTRATION LIST
        if (activity.registeredStaffIds) {
            activity.registeredStaffIds = activity.registeredStaffIds.filter(
                id => Number(id) !== employeeId
            );
            activity.registeredSlots = activity.registeredStaffIds.length;
            activity.markModified('registeredStaffIds');
        }

        // 🌟 2. NEW: REMOVE FROM ATTENDANCE LIST (Data Cleanup)
        if (activity.attendedStaffIds) {
            activity.attendedStaffIds = activity.attendedStaffIds.filter(
                id => Number(id) !== employeeId
            );
            activity.markModified('attendedStaffIds');
        }

        // Save the cleaned-up activity back to the database
        await activity.save();
        console.log(`🗑️ Cleanup Complete: User ${employeeId} completely removed from Activity ${activityId}`);

        // 3. TRIGGER CANCELLATION NOTIFICATION
        const cancelNotif = new Notification({
            recipientId: employeeId,
            type: 'Cancellation',
            title: 'Registration Withdrawn',
            message: `You have successfully withdrawn from "${activity.title}".`,
            activityId: activityId
        });
        await cancelNotif.save();
        console.log(`✉️ Cancellation notification created for user ${employeeId}`);

        res.json({ message: 'Cancellation and data cleanup successful' });

    } catch (error) {
        console.error('🔥 Cancellation Error:', error);
        res.status(500).json({ error: 'Error cancelling registration' });
    }
});
// ==========================================
// 5. NOTIFICATION API ROUTES (NEW)
// ==========================================

// Get all notifications for a specific user
app.get('/api/notifications/:employeeId', async (req, res) => {
    try {
        const userId = Number(req.params.employeeId);
        const userInbox = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 });
        res.json(userInbox);
    } catch (error) {
        res.status(500).json({ error: "Failed to load inbox" });
    }
});

// Get unread notification count
app.get('/api/notifications/:employeeId/count', async (req, res) => {
    try {
        const userId = Number(req.params.employeeId);
        const count = await Notification.countDocuments({ recipientId: userId, isRead: false });
        res.json({ unreadCount: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Broadcast Message
app.post('/api/admin/broadcast', async (req, res) => {
    try {
        const { title, message } = req.body;

        // 1. Get all employees
        const employees = await Employee.find({});

        if (!employees || employees.length === 0) {
            return res.status(400).json({ error: "No employees found to broadcast to." });
        }

        // 2. Map them safely (Filtering out anyone without an ID just in case)
        const broadcastNotifs = employees
            .filter(emp => emp.id) // Safety check!
            .map(emp => ({
                recipientId: Number(emp.id), // Force it to be a number
                type: 'Broadcast',
                title: title || 'Admin Announcement',
                message: message || 'Please check the dashboard.',
                isRead: false
            }));

        // 3. Save to MongoDB
        await Notification.insertMany(broadcastNotifs);

        console.log(`✅ Broadcast successfully sent to ${broadcastNotifs.length} users!`);
        res.json({ message: "Broadcast sent to all employees!" });

    } catch (err) {
        // This prints the EXACT Mongoose error to your VS Code terminal
        console.error("🔥 Broadcast Error details:", err);
        res.status(500).json({ error: "Broadcast failed" });
    }
});
// ==========================================
// 🌟 NEW: ADMIN: Remove a Participant
// ==========================================
app.delete('/api/activities/:activityId/participants/:employeeId', async (req, res) => {
    try {
        const activityId = Number(req.params.activityId);
        const employeeId = Number(req.params.employeeId);

        const activity = await Activity.findOne({ id: activityId });

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        // 1. REMOVE FROM REGISTRATION LIST
        if (activity.registeredStaffIds) {
            activity.registeredStaffIds = activity.registeredStaffIds.filter(
                id => Number(id) !== employeeId
            );
            // Recalculate filled slots
            activity.registeredSlots = activity.registeredStaffIds.length;
            activity.markModified('registeredStaffIds');
        }

        // 2. REMOVE FROM ATTENDANCE LIST (Data Cleanup)
        if (activity.attendedStaffIds) {
            activity.attendedStaffIds = activity.attendedStaffIds.filter(
                id => Number(id) !== employeeId
            );
            activity.markModified('attendedStaffIds');
        }

        // Save the cleaned-up activity back to MongoDB
        await activity.save();
        console.log(`🛡️ Admin Cleanup: User ${employeeId} removed from Activity ${activityId}`);

        // 3. NOTIFY THE EMPLOYEE
        const removalNotif = new Notification({
            recipientId: employeeId,
            type: 'Cancellation',
            title: 'Registration Removed',
            message: `An admin has removed your registration for "${activity.title}".`,
            activityId: activityId,
            isRead: false
        });
        await removalNotif.save();

        res.json({ message: 'Participant successfully removed by admin' });

    } catch (error) {
        console.error('🔥 Admin Remove Participant Error:', error);
        res.status(500).json({ error: 'Failed to remove participant' });
    }
});
// ==========================================
// AUTOMATED CRON ENGINE (Runs every minute)
// ==========================================
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const activities = await Activity.find({});

        for (let activity of activities) {
            // Skip if no date or no registered users
            if (!activity.date || !activity.registeredStaffIds || activity.registeredStaffIds.length === 0) continue;

            const dateOnly = new Date(activity.date).toISOString().split('T')[0];
            const eventDateTime = new Date(`${dateOnly}T${activity.time}:00`);
            const timeDiffMs = eventDateTime.getTime() - now.getTime();
            const minutesLeft = timeDiffMs / (1000 * 60);
            const daysLeft = timeDiffMs / (1000 * 3600 * 24);

            let reminderTypeToSend = null;

            if (activity.reminders?.oneWeek && daysLeft <= 7 && daysLeft > 6.9) {
                reminderTypeToSend = "1 Week";
            } else if (activity.reminders?.threeDays && daysLeft <= 3 && daysLeft > 2.9) {
                reminderTypeToSend = "3 Days";
            } else if (activity.reminders?.oneDay && daysLeft <= 1 && daysLeft > 0.9) {
                reminderTypeToSend = "1 Day";

                // 🌟 THE FIX: Broaden the test window.
                // If the event starts in the next 5 minutes, OR if it started up to an hour ago, trigger the test!
            } else if (activity.reminders?.oneSecond && minutesLeft <= 5 && minutesLeft >= -60) {
                reminderTypeToSend = "Starting Soon (Test)";
            }

            // If a valid time window is hit, send the email
            if (reminderTypeToSend) {
                await processAutomatedReminder(activity, reminderTypeToSend);
            }
        }
    } catch (error) {
        console.error("🔥 Cron Engine Error:", error);
    }
});

// ==========================================
// HELPER: PROCESS & SEND THE REMINDER
// ==========================================
async function processAutomatedReminder(activity, reminderType) {
    try {
        // 1. Anti-Spam Check: Did we already send THIS specific reminder?
        const alreadySent = await Email.findOne({
            activityId: activity.id,
            message: `Automated ${reminderType} reminder.`
        });

        if (alreadySent) return; // Exit if already sent

        // 2. Gather Participant Emails
        const participants = await Employee.find({ id: { $in: activity.registeredStaffIds } });
        const recipientEmails = participants.map(emp => emp.email).filter(email => email).join(',');

        if (!recipientEmails) return;

        // 3. Draft the Email Payload
        const emailPayload = {
            to: recipientEmails,
            subject: `⏰ Reminder: ${activity.title} is ${reminderType} away!`,
            body: `
                <div style="font-family: Arial; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
                    <h2 style="color: #0ea5e9;">Upcoming Event Reminder</h2>
                    <p>Hello Volunteer,</p>
                    <p>This is an automated reminder that <strong>${activity.title}</strong> is happening soon.</p>
                    <p><strong>Date:</strong> ${new Date(activity.date).toDateString()}</p>
                    <p>Please check your dashboard for full details.</p>
                </div>
            `
        };

        // 4. Send to Google Apps Script
        // 🌟 CRITICAL: PASTE YOUR GOOGLE SCRIPT URL HERE
        const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwcq8FbZc6-m0o_Xk1ZmQKl6TdOULjZWPIx2AjmdwakjbP0AjzvByCvai3svE2xKaqq/exec";

        await fetch(googleScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload)
        });

        // 5. Log it in MongoDB to prevent double-sending
        const logEntry = new Email({
            recipientEmail: recipientEmails,
            subject: emailPayload.subject,
            message: `Automated ${reminderType} reminder.`,
            emailType: 'Schedule',
            activityId: activity.id
        });
        await logEntry.save();

        console.log(`✅ [CRON] ${reminderType} emails sent for: ${activity.title}`);

    } catch (error) {
        console.error(`❌ [CRON] Failed to process ${reminderType} for ${activity.title}`, error);

    }
}

// ==========================================
// QR CODE ATTENDANCE API
// ==========================================
app.post('/api/activities/attendance', async (req, res) => {
    try {
        // 🌟 FORCE THESE TO BE NUMBERS IMMEDIATELY
        const employeeId = Number(req.body.employeeId);
        const activityId = Number(req.body.activityId);

        const activity = await Activity.findOne({ id: activityId });
        const employee = await Employee.findOne({ id: employeeId });

        if (!activity || !employee) {
            return res.status(404).json({ error: "Activity or Employee not found." });
        }

        // 🌟 FIX 1: Use .some() with Number() casting instead of .includes()
        const isRegistered = activity.registeredStaffIds.some(id => Number(id) === employeeId);
        if (!isRegistered) {
            return res.status(400).json({ error: "Employee is not registered for this activity." });
        }

        // 🌟 FIX 2: Check attended list with Number() casting
        if (!activity.attendedStaffIds) activity.attendedStaffIds = [];
        const isAlreadyScanned = activity.attendedStaffIds.some(id => Number(id) === employeeId);
        if (isAlreadyScanned) {
            return res.status(400).json({ message: "Attendance already recorded!" });
        }

        // 3. Mark as Attended
        activity.attendedStaffIds.push(employeeId);
        activity.markModified('attendedStaffIds');
        await activity.save();

        // 4. Check the Anti-Spam Email Schema
        const alreadySent = await Email.findOne({
            activityId: activity.id,
            recipientEmail: employee.email,
            emailType: 'Attendance'
        });
        if (!alreadySent) {
            // ... (Keep all your existing emailPayload and fetch logic exactly the same inside here) ...
            const emailPayload = {
                to: employee.email,
                subject: `✅ Attendance Confirmed: ${activity.title}`,
                body: `
                    <div style="font-family: Arial; padding: 20px; border: 1px solid #10b981; border-radius: 10px;">
                        <h2 style="color: #10b981;">Attendance Confirmed!</h2>
                        <p>Hello ${employee.name || 'Volunteer'},</p>
                        <p>Thank you for attending <strong>${activity.title}</strong> today.</p>
                        <p>Your presence makes a huge difference. Your attendance has been officially recorded in the system.</p>
                    </div>
                `
            };

            const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwcq8FbZc6-m0o_Xk1ZmQKl6TdOULjZWPIx2AjmdwakjbP0AjzvByCvai3svE2xKaqq/exec";

            console.log(`⏳ Sending Attendance Ticket to Google Apps Script...`);
            const response = await fetch(googleScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload)
            });

            const result = await response.text();
            console.log("✅ Google Script Reply:", result);

            if (response.ok) {
                const logEntry = new Email({
                    recipientEmail: employee.email,
                    subject: emailPayload.subject,
                    message: `Attendance recorded for ${employee.name}.`,
                    emailType: 'Attendance',
                    activityId: activity.id
                });
                await logEntry.save();
                console.log(`💾 Success: Attendance Email permanently logged in MongoDB!`);
            } else {
                console.error("🚨 Google Script rejected the email:", result);
            }

        } else {
            // 🌟 NEW: This will tell you if the Anti-Spam block is stopping your email!
            console.log(`⚠️ Email Skipped: The database shows we already sent an attendance email to ${employee.email} for this activity!`);
        }

        res.json({ message: "Attendance recorded successfully!" });

    } catch (error) {
        console.error("🔥 Attendance Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// ==========================================
// 6. START ENGINE
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Service Day Backend is running on http://localhost:${PORT}`);
});