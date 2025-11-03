import { Router } from 'express';
import { signup, login,
     logout,
     refreshToken,
     sendOtp,
     verifyOtp,
     forgotPassword,
     resetPassword,
     getMe,
     getAllUsers
     } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/signup', signup);
router.post('/login', login);


router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password", resetPassword);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Protected routes
router.use(protect);

router.post("/logout", logout);
router.get("/me", getMe);

// Private/Protected Route Example  
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);

export default router;