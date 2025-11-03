import { Router } from 'express';
import { signup, login,
     getMe,
     getAllUsers
     } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/signup', signup);
router.post('/login', login);

// Private/Protected Route Example
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);

export default router;