import bcrypt from 'bcrypt';
import pool from '../config/dbConfig.js';
import multer from 'multer';

const storage = multer.memoryStorage();
export const upload = multer( { storage } );


// Update profile picture service
export const updateProfilePicService = (email, profilePicBuffer, callback) => {
    if (!email) {
        return callback({ error: "Email is required" });
    }
    if (!profilePicBuffer) {
        return callback({ error: "No profile picture uploaded" });
    }

    pool.query(
        "UPDATE users SET profile_picture = ? WHERE email = ?",
        [profilePicBuffer, email],
        (error, results) => {
            if (error) {
                console.error("Failed to update profile picture", error.message);
                return callback({ error: "Failed to update profile picture" });
            }

            if (results.affectedRows === 0) {
                return callback({ error: "No user found with that email" });
            }

            callback(null, { message: "Profile picture updated successfully" });
        }
    );
};

//update user details
export const updateUserService = (email, newEmail, fullName, password, callback) => {
    const updates = {};

    if (newEmail) updates.email = newEmail;
    if (fullName) updates.fullName = fullName;

    const saveUser = () => {
        if (Object.keys(updates).length === 0 && !password) {
            return callback({ error: "Nothing to update" });
        }

        if (Object.keys(updates).length > 0) {
            pool.query(
                "UPDATE users SET ? WHERE email = ?",
                [updates, email],
                (error) => {
                    if (error) return callback({ error: "Failed to update user" });
                    if (!password) return callback(null, { message: "Details updated successfully" });
                    hashPasswordAndUpdate();
                }
            );
        } else if (password) {
            hashPasswordAndUpdate();
        }
    };

    const hashPasswordAndUpdate = () => {
        bcrypt.hash(password, 10, (error, hash) => {
            if (error) return callback({ error: "Password hashing failed" });

            pool.query(
                "UPDATE users SET password = ? WHERE email = ?",
                [hash, email],
                (error) => {
                    if (error) return callback({ error: "Failed to update password" });
                    callback(null, { message: "Details updated successfully" });
                }
            );
        });
    };

    saveUser();
};


export const deleteUserService = (email, callback) => {
    pool.query(
        "DELETE FROM users WHERE email = ?",
        [email],
        (error, results) => {
            if (error) return callback({ error: "Failed to delete user" });
            if (results.affectedRows === 0) return callback({ error: "No user found" });

            // Reset preloaded admin registration if applicable
            pool.query(
                "UPDATE preloadedAdmins SET isRegistered = false WHERE pre_admin_email = ?",
                [email],
                (err) => {
                    if (err) console.error("Failed to reset preloaded admin registration", err.message);
                }
            );

            callback(null, { message: "User deleted successfully" });
        }
    );
};