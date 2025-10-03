import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';

// Removed the local AuthenticatedRequest interface.
// The Request interface is now extended globally via src/types/express.d.ts

/**
 * Protects routes by verifying the JWT in the Authorization header.
 * Attaches the authenticated user document to the request object.
 */
// The Request type from 'express' is now globally augmented to include the 'user' property.
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Check for token in the 'Authorization' header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: 'Bearer TOKEN')
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("JWT_SECRET is not defined.");
                res.status(500).json({ message: 'Server configuration error.' });
                return;
            }
            
            // Decode the token (payload type is any because JWT is generic)
            const decoded = jwt.verify(token, secret) as { id: string };

            // Find user by ID and attach to request object
            // We explicitly select the password here to prevent issues in case the model's 'select: false' is ignored
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            // Assigning 'user' property to the Request object, which is now possible globally.
            // req.user is now correctly typed as IUser | undefined globally.
            req.user = user as IUser; 
            next();

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};
