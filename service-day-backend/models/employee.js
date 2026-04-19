import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    role: { type: String, required: true }
});

export default mongoose.model('Employee', employeeSchema);