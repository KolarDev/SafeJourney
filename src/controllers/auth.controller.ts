import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT
const generateToken = (id: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    
    // FIX: Explicitly cast the options object as jwt.SignOptions to satisfy the TypeScript compiler
    // and correctly handle properties like 'expiresIn'.
    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    } as jwt.SignOptions); 
};

/**
 * @desc Register a new user
 * @route POST /api/v1/auth/signup
 * @access Public
 */
export const signup = async (req: Request, res: Response): Promise<Response> => {
    const { fullname, phonenumber, email, password, passwordConfirm } = req.body;

    // 1. Basic Validation
    if (!fullname || !phonenumber || !email || !password || !passwordConfirm) {
        return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        // 2. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        // 3. Create user (password is automatically hashed via pre-save hook)
        const user = await User.create({
            fullname,
            phonenumber,
            email,
            password,
        });

        if (user) {
            // 4. Respond with token and user info
            return res.status(201).json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data received' });
        }
    } catch (error: any) {
        // Handle MongoDB/Mongoose validation errors
        console.error('Signup Error:', error);
        return res.status(500).json({ message: error.message || 'Server error during registration.' });
    }
};

/**
 * @desc Authenticate a user & get token
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    try {
        // 1. Check for user by email, and explicitly select the password field
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password))) {
            // 2. Passwords match, return success
            return res.status(200).json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            // 3. Auth failed
            return res.status(401).json({ message: 'Invalid credentials (email or password incorrect).' });
        }
    } catch (error: any) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: error.message || 'Server error during login.' });
    }  
};

/**
 * @desc Get user profile (Example of protected route)
 * @route GET /api/v1/auth/me
 * @access Private
 */
// export const getMe = (req: Request, res: Response): Response => {
//     // The user object is attached by the 'protect' middleware
//     // We can now access req.user directly because the Request type is globally augmented.
//     const user = req.user;
    
//     if (user) {
//         return res.status(200).json({
//             _id: user._id,
//             fullname: user.fullname,
//             email: user.email,
//             phonenumber: user.phonenumber,
//             createdAt: user.createdAt,
//         });
//     } else {
//         return res.status(404).json({ message: 'User not found in request context.' });
//     }
// };
