import express from 'express';
import { registerUser, verifyUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

//routes
router.post('/register', registerUser);
router.post('/register/verify', verifyUser);
router.post('/login', loginUser);

export default router;