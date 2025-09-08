import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {sendVerificationEmail} from '../utils/emailSender.js';
import pool from '../config/dbConfig.js';

const verificationCodes = {};
const pendingUsers = {};


export const registerUserService = (fullName, email, password, role, callback) => {
    if (!fullName || !email || !password) {
        return callback({ error: 'All fields are required' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return callback({ error: "Invalid email format" });
    }

    // Check if the user already exists
    pool.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
        if (error) {
            console.error("DB error:", error.message);
            return callback({ error: "Database error" });
        }

        // User exists
        if (results.length > 0) {
            const existingUser = results[0];

            // If they are trying to register as admin
            if (role === 'admin') {
                // Check if email is a preloaded admin
                pool.query(
                    "SELECT * FROM preloadedAdmins WHERE pre_admin_email = ?",
                    [email],
                    (err, adminResults) => {
                        if (err) {
                            console.error("DB error:", err.message);
                            return callback({ error: "Database error" });
                        }

                        if (adminResults.length === 0) {
                            // Not a preloaded admin → cannot upgrade
                            return callback({ error: "You are not authorized to register as admin" });
                        }

                        // Preloaded admin → allow role upgrade
                        if (existingUser.role === 'admin') {
                            return callback({ message: "You are already registered as admin" });
                        }

                        pool.query(
                            "UPDATE users SET role = 'admin' WHERE email = ?",
                            [email],
                            (updateErr) => {
                                if (updateErr) {
                                    console.error("Failed to upgrade role:", updateErr.message);
                                    return callback({ error: "Failed to upgrade to admin" });
                                }

                                return callback(null, { 
                                    message: "Your role has been upgraded to admin",
                                    email: existingUser.email,
                                    fullName: existingUser.fullName,
                                    role: 'admin'
                                });
                            }
                        );
                    }
                );
            } else {
                // Trying to register as normal user → block
                return callback({ error: "User already exists, please login" });
            }

            return; // Important: stop further processing
        }

        // User does not exist → normal registration flow

        // If role is 'admin', ensure email is in preloadedAdmins
        if (role === 'admin') {
            pool.query(
                "SELECT * FROM preloadedAdmins WHERE pre_admin_email = ?",
                [email],
                (err, adminResults) => {
                    if (err) {
                        console.error("DB error:", err.message);
                        return callback({ error: "Database error" });
                    }

                    if (adminResults.length === 0) {
                        return callback({ error: "You are not authorized to register as admin" });
                    }

                    // Email is authorized → proceed
                    sendVerification();
                }
            );
        } else {
            // Role is 'user' → proceed normally
            sendVerification();
        }

        // Helper function to send verification code
        function sendVerification() {
            const code = Math.floor(1000 + Math.random() * 9000);
            verificationCodes[email] = code;
            pendingUsers[email] = { fullName, email, password, role: role || 'user' };

            sendVerificationEmail(email, code, (error) => {
                if (error) {
                    return callback({ error: "Failed to send email", details: error.message });
                }
                console.log(`Verification code for ${email}: ${code}`);
                callback(null, { message: 'Verification code sent to your email' });
            });
        }
    });
};



export const verifyUserService = (email, code, callback) => {
    if (!email || !code){
        return callback({ error: 'Email and code are required' });
    } 
    if(verificationCodes[email] != code){
        return callback({ error: "Invalid verification code"});
    }

    const userData = pendingUsers[email];
    if (!userData) {
        return callback({ error: "No registration found for this email" });
    }

    bcrypt.hash(userData.password, 10, (error, hash) => {
        if (error) {
            console.error("Error hashing password", error);
            return callback({ error: "Password hashing failed" });
        }

        const user = {
            fullName: userData.fullName,
            email: userData.email,                        
            password: hash,
            role: userData.role
        };

        pool.query("INSERT INTO users SET ?", 
            user,
        (error) => {
            if (error) {
                console.error("Error registering user", error.message);
                return callback({ error: "Failed to register user" });
            }

            if (user.role === 'admin') {
                pool.query(
                    "UPDATE preloadedAdmins SET isRegistered = true WHERE pre_admin_email = ?",
                    [email],
                    (err) => {
                        if (err) {
                            console.error("Failed to mark preloaded admin as registered:", err.message);
                        } else {
                            console.log(`Preloaded admin ${email} marked as registered`);
                        }
                    }
                );
            }

            delete verificationCodes[email];
            delete pendingUsers[email];        

            callback(null, {
                message: "User verified and registered successfully",
                fullName: user.fullName,
                email: user.email,
                role: user.role
            });
            
        });
    });
};


//logging in
export const loginUserService = (email, password, callback) => {
    if (!email || !password) {
        return callback({ error: 'Email and password are required' });
    }

    //check if user exists
    pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (error, results) => {
        if (error) {
            console.error("DB error:", error.message);
            return callback({ error: "Database error" });
        }

        if (results.length === 0) {
            return callback({ message: "User does not exist, please register" });
        }

        const user = results[0];
        
        bcrypt.compare(password, user.password, (err, passwordMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err.message);
                return callback({ error: "Password comparison failed" });
            }

            if (!passwordMatch) {
                return callback({ error: "Incorrect password" });
            }

            const token = jwt.sign(
                { email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            const refreshToken = jwt.sign(
                { email: user.email, role: user.role },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            callback(null,{
                message: "User login successful",
                email: user.email,
                role: user.role
            });
        });

        }
    );
};