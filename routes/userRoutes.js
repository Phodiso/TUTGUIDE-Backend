import express from 'express';
import { 
    updateProfilePicController, 
    updateUserController, 
    deleteUserController 
} from '../controllers/userController.js';
import { upload } from '../services/userService.js';
import { authorize } from '../middlewares/auth.js';

const router = express.Router();

// PUT - Update profile picture (requires file upload)
router.put('/update/profilePic', authorize(), upload.single('profilePic'), updateProfilePicController);

// PUT - Update other user details (email, fullName, password)
router.put('/update', authorize(), updateUserController);

// DELETE - Delete logged-in user
router.delete('/delete', authorize(), deleteUserController);

export default router;
