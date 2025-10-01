import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the interface for a User document
export interface IUser extends Document {
    fullname: string;
    phonenumber: string;
    email: string;
    password: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
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
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);

// Mongoose pre-save hook to hash the password before saving
UserSchema.pre<IUser>('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) {
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
