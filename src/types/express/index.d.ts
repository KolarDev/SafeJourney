// This file is a TypeScript declaration file (.d.ts) that uses module augmentation
// to extend the types of the 'express' module globally.

// Import the necessary interface for the user object
import { IUser } from '../../models/user.model'; 

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}
