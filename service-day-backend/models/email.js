import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
    recipientEmail: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    emailType: {
        type: String,
        enum: ['Schedule', 'Attendance','Registration'],
        required: true
    },
    activityId: { type: Number, required: false },
    sentAt: { type: Date, default: Date.now }
});

// 🌟 CHANGED: Now it's just 'Email'
export default mongoose.model('Email', EmailSchema);