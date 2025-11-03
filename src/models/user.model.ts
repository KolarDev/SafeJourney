import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the interface for a User document
export interface IUser extends Document {
    createdAt: any;
    fullname: string;
    phonenumber: string;
    email: string;
    password: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
    role: 'user' | 'admin';
    resetPasswordToken?: string; 
    resetPasswordExpire?: Date;
}

const UserSchema: Schema = new Schema(
    {
        fullname: { type: String, required: [true, 'Please add a full name'] },
        phonenumber: { 
            type: String, 
            required: [true, 'Please add a phone number'],
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please fill a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please set a password'],
            minlength: 6,
            select: false, // Do not return the password by default
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);
UserSchema.pre<IUser>('save', async function (next) {
    // Only run this function if password was actually modified AND it's not the reset token
    // The reset flow updates the password field, so we only need to check if password was modified.
    if (!this.isModified('password')) {
        // Clear reset tokens if other fields are modified (optional, but safer)
        if (!this.isModified('resetPasswordToken')) {
             this.resetPasswordToken = undefined;
             this.resetPasswordExpire = undefined;
        }
        return next();
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare candidate password with the hashed password in the database
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    // 'this.password' needs to be explicitly selected in the query for this to work
    return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
