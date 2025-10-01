// This file is a TypeScript declaration file (.d.ts) that uses module augmentation
// to extend the types of the 'express' module globally.

// Import the necessary interface for the user object
import { IUser } from '../models/user.model'; 

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    /**
     * Augment the Express Request interface to include the authenticated user object.
     * This allows us to access 'req.user' in any protected route handler without 
     * explicit casting or custom type imports.
     */
    export interface Request {
      // The user object added by the 'protect' authentication middleware
      user?: IUser;
    }
  }
}
