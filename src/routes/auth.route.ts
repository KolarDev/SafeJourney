import { Router } from 'express';
import { signup, login,
    //  getMe
     } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/signup', signup);
router.post('/login', login);

// Private/Protected Route Example
// router.get('/me', protect, getMe);

export default router;
