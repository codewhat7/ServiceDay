import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    totalSlots: { type: Number, required: true },
    registeredSlots: { type: Number, default: 0 },
    organization: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    registeredStaffIds: [{ type: Number }],
    attendedStaffIds: [{ type: Number }],
    reminders: {
        oneWeek: { type: Boolean, default: false },
        threeDays: { type: Boolean, default: false },
        oneDay: { type: Boolean, default: false },
        oneSecond: { type: Boolean, default: false }
    }
});

export default mongoose.model('Activity', activitySchema);