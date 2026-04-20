import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipientId: { type: Number, required: false }, // Staff ID (null for Broadcasts)
    type: {
        type: String,
        enum: ['Reminder', 'Broadcast', 'Update', 'Registration', 'Cancellation'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    activityId: { type: Number, required: false } // Link to the specific activity
});

export default mongoose.model('Notification', NotificationSchema);