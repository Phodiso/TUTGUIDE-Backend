import bcrypt from 'bcrypt';
import pool from '../config/dbConfig.js';
import multer from 'multer';

const storage = multer.memoryStorage();
export const upload = multer( { storage } );

export const updateUserService = (oldEmail,newEmail, fullName, password, profilePicBuffer, callback) => {
    if(!oldEmail){
        return callback({ error: "Current email is requid"});
    }

    const updates = {};
    
    if(newEmail){
        updates.email = newEmail;
    }
    if(fullName){
        updates.fullName = fullName;
    }
    if(profilePicBuffer){
        updates.profile_picture = profilePicBuffer;
    }

    const saveUser = () => {
        if(Object.keys(updates).length === 0){
            return callback ({ error: "Nothing to update"});
        }

        pool.query(
            "UPDATE users SET ? WHERE email = ?",
            [updates, oldEmail],
            (error) => {
                if(error){
                    return callback({ error: "Failed to update user"});
                }

                callback(null, {message: "Details updated successfully"});
            }
        );
    };

    if(password){
        bcrypt.hash(password, 10, (error, hash) =>{
            if(error){
                return callback({ error: "Password hashing failed"});
            }
            updates.password = hash;
            saveUser();
        });
    }else {
        saveUser();
    }
};

export const deleteUserService = (email, callback) => {
    if(!email){
        return callback({ error: "Email is required" });
    }

    pool.query(
        "DELETE FROM users WHERE email = ?",
        [email],
        (error, results) => {
            if(error){
                return callback({ error: "Failed to delete user" });
            } 

            if(results.affectedRows === 0){
            return callback({ error: "No user found with that email" });
            }

            
            //resert preloaded admin registration
            pool.query(
                "UPDATE preloadedAdmins SET isRegistered = false WHERE pre_admin_email = ?",
                [email],
                (err) => {
                    if(err){
                        console.error("Failed to update registration status on preloaded admins", err.message);
                    }

                }
            );

            callback(null, {message: "User deleted successfully"})
        }
    );
}