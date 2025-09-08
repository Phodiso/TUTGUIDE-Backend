import express from 'express';
import { updateUserController, deleteUserController } from '../controllers/userController.js';
import { upload } from '../services/userService.js';

const router = express.Router();

// PUT - Update user (with profile pic upload support)
router.put('/update', upload.single('profilePic'), updateUserController);

// DELETE - Delete user
router.delete('/delete', deleteUserController);

export default router;
