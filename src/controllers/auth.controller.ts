import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';

// Helper function to generate Access Token (short lived)
const generateAccessToken = (id: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    
    // Adjusted to 1 hour for typical access token
    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h', 
    } as SignOptions); 
};

// Helper function to generate Refresh Token (longer lived)
const generateRefreshToken = (id: string): string => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET or JWT_REFRESH_SECRET is not defined.');
    }

    // Long lifespan for refresh token
    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', 
    } as SignOptions); 
}

// Helper function to send Access and Refresh tokens
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // In a real app, you would manage the refresh token securely (e.g., HttpOnly cookie).
    res.status(statusCode).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
        }
    });
};


/**
 * @desc Register a new user
 * @route POST /api/v1/auth/signup
 * @access Public
 */
// Wrapped with catchAsync
export const signup = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { fullname, phonenumber, email, password, passwordConfirm } = req.body;

    // 1. Basic Validation (Keep non-async validation with early return)
    if (!fullname || !phonenumber || !email || !password || !passwordConfirm) {
        res.status(400).json({ message: 'Please enter all required fields.' });
        return;
    }

    if (password !== passwordConfirm) {
        res.status(400).json({ message: 'Passwords do not match.' });
        return;
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400).json({ message: 'User already exists with this email.' });
        return;
    }

    // 3. Create user (Mongoose errors will be caught by catchAsync)
    const user = await User.create({
        fullname,
        phonenumber,
        email,
        password,
    });

    if (user) {
        // 4. Respond with tokens and user info
        sendTokenResponse(user, 201, res);
    } else {
        res.status(400).json({ message: 'Invalid user data received' });
    }
});

/**
 * @desc Authenticate a user & get token
 * @route POST /api/v1/auth/login
 * @access Public
 */
// Wrapped with catchAsync
export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Please enter both email and password.' });
        return;
    }

    // 1. Check for user by email, and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Check password (Auth failed - uses response, not throwing exception)
    if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ message: 'Invalid credentials (email or password incorrect).' });
        return;
    }

    // Success
    sendTokenResponse(user, 200, res);
});

/**
 * @desc Log user out / Clear cookie
 * @route POST /api/v1/auth/logout
 * @access Private/Public
 */
// Not async, no change needed
export const logout = (req: Request, res: Response): Response => {
    // Client should discard Access Token and Refresh Token. 
    return res.status(200).json({ success: true, message: 'Logged out successfully. Client tokens discarded.' });
};

/**
 * @desc Regenerate access token using a refresh token
 * @route POST /api/v1/auth/refresh
 * @access Public (Requires valid refresh token)
 */
// Wrapped with catchAsync
export const refreshTokenRegenerate = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(401).json({ message: 'Not authorized, refresh token missing.' });
        return;
    }
    
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    // jwt.verify throws an exception on failure, which catchAsync handles
    const decoded = jwt.verify(refreshToken, secret) as IUser;

    const user = await User.findById(decoded.id);

    if (!user) {
        res.status(401).json({ message: 'Invalid refresh token: User not found.' });
        return;
    }

    const newAccessToken = generateAccessToken(user.id);

    res.status(200).json({
        success: true,
        accessToken: newAccessToken,
    });
});


// --- OTP & Password Reset Flow ---

/**
 * @desc Send OTP (Placeholder - requires mailer service/Twilio)
 * @route POST /api/v1/auth/send-otp
 * @access Public
 */
// Wrapped with catchAsync
export const sendOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        // Business logic: Send 200 even if user isn't found (prevents email enumeration)
        res.status(200).json({ success: true, message: 'If user exists, OTP has been sent.' });
        return;
    }
    
    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Hash and Save to DB
    user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes
    await user.save({ validateBeforeSave: false });

    // WARNING: test_otp only for dev, remove in production!
    res.status(200).json({ success: true, message: 'OTP token sent to email.', test_otp: otp }); 
});


/**
 * @desc Verify OTP (Used as a step before resetPassword)
 * @route POST /api/v1/auth/verify-otp
 * @access Public
 */
// Wrapped with catchAsync
export const verifyOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;

    // Hash the incoming OTP to compare with the hash stored in the database
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({ email });

    if (!user || user.resetPasswordToken !== hashedOTP || user.resetPasswordExpire < new Date(Date.now())) {
        res.status(400).json({ message: 'Invalid or expired OTP/Code.' });
        return;
    }

    // If OTP is valid, generate a unique, short-lived token 
    const temporaryResetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = temporaryResetToken; 
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'OTP verified successfully. Use the temporary token for reset.', temporaryResetToken });
});


/**
 * @desc Placeholder for forgot password (aliased to sendOTP)
 * @route POST /api/v1/auth/forgotpassword
 * @access Public
 */
export const forgotPassword = sendOTP; 


/**
 * @desc Reset password using the temporary token received after OTP verification
 * @route PUT /api/v1/auth/resetpassword
 * @access Public (Requires the temporary token from verifyOTP)
 */
// Wrapped with catchAsync
export const resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { temporaryResetToken, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword !== confirmPassword) {
        res.status(400).json({ message: 'Passwords do not match or new password is empty.' });
        return;
    }

    // 1. Find user by the temporary token
    const user = await User.findOne({
        resetPasswordToken: temporaryResetToken,
        // Check expiry here in production
    }).select('+password');

    if (!user) {
        res.status(400).json({ message: 'Invalid or expired temporary reset token.' });
        return;
    }

    // 2. Set new password and clear tokens
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save(); // Save hook will re-hash the password

    // 3. Log user in with new credentials
    sendTokenResponse(user, 200, res);
});

/**
 * @desc Get user profile (Protected Route)
 * @route GET /api/v1/auth/me
 * @access Private
 */
// Not async, no change needed
export const getMe = (req: Request, res: Response): Response => {
    // Relying on global type augmentation for req.user access
    const user = req.user as IUser; 
    
    if (user) {
        return res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phonenumber: user.phonenumber,
            createdAt: user.createdAt,
        });
    } else {
        return res.status(404).json({ message: 'User not found in request context.' });
    }
};

/**
 * @desc Get all users (Protected Route)
 * @route GET /api/v1/auth/users
 * @access Private
 */
// Wrapped with catchAsync
export const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Find all users and exclude sensitive fields
    const users = await User.find().select('-password -__v');

    if (users.length === 0) {
        res.status(404).json({ message: 'No users found.' });
        return;
    }

    res.status(200).json({
        count: users.length,
        users,
    });
});
