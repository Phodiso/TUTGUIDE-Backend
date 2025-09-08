import express from 'express';
import { updateUserService, deleteUserService} from '../services/userService.js';

//update user controller
export const updateUserController = (req, res) => {
    const {oldEmail, newEmail, fullName, password} = req.body;
    const profilePicBuffer = req.file ? req.file.buffer : null;

    if (!oldEmail) {
        return res.status(400).json({ error: "Current email (oldEmail) is required" });
    }

    updateUserService(oldEmail, newEmail, fullName, password, profilePicBuffer, (error, result) => {
        if(error){
            return res.status(400).json(error);
        }

        res.json(result);
    });
};

export const deleteUserController = (req, res) =>{
    const email = req.body?.email?.trim();

    deleteUserService(email, (error, result) =>{
        if(error){
            return res.status(400).json(error);
        }

        res.json(result);
    });
};