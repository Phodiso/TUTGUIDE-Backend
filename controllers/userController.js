import { updateProfilePicService, updateUserService, deleteUserService } from '../services/userService.js';

// Update profile picture for logged-in user
 
export const updateProfilePicController = (req, res) => {
    const email = req.user.email; // email from JWT
    const profilePicBuffer = req.file ? req.file.buffer : null;

    updateProfilePicService(email, profilePicBuffer, (error, result) => {
        if (error) {
            return res.status(400).json(error);
        }
        res.json(result);
    });
};

//Update user details (email, fullName, password) for logged-in user

export const updateUserController = (req, res) => {
    const { newEmail, fullName, password } = req.body;
    const email = req.user.email; // email from JWT

    updateUserService(email, newEmail, fullName, password, (error, result) => {
        if (error) {
            return res.status(400).json(error);
        }
        res.json(result);
    });
};

// Delete logged-in user

export const deleteUserController = (req, res) => {
    const email = req.user.email; // email from JWT

    deleteUserService(email, (error, result) => {
        if (error) {
            return res.status(400).json(error);
        }
        res.json(result);
    });
};
