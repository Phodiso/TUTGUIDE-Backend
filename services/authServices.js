import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/emailSender.js';
import pool from '../config/dbConfig.js';

const verificationCodes = {};
const pendingUsers = {};

// Register user service
export const registerUserService = (fullName, email, password, role, callback) => {
    if (!fullName || !email || !password) {
        return callback({ error: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return callback({ error: "Invalid email format" });
    }

    pool.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
        if (error) return callback({ error: "Database error" });

        if (results.length > 0) {
            // User already exists
            return callback({ error: "User already exists, please login" });
        }

        // Check if email is a preloaded admin
        pool.query("SELECT * FROM preloadedAdmins WHERE pre_admin_email = ?", [email], (err, adminResults) => {
            if (err) return callback({ error: "Database error" });

            if (adminResults.length > 0) {
                // Preloaded admin email
                if (role !== 'admin') {
                    return callback({ error: "Preloaded admins can only register as admin" });
                }
            } else {
                // Not a preloaded admin → must be normal user
                if (role === 'admin') {
                    return callback({ error: "You are not authorized to register as admin" });
                }
            }

            // Send verification code
            const code = Math.floor(1000 + Math.random() * 9000);
            verificationCodes[email] = code;
            pendingUsers[email] = { fullName, email, password, role: role || 'user' };

            sendVerificationEmail(email, code, (emailError) => {
                if (emailError) return callback({ error: "Failed to send email", details: emailError.message });
                console.log(`Verification code for ${email}: ${code}`);
                callback(null, { message: 'Verification code sent to your email' });
            });
        });
    });
};

// Verify user service
export const verifyUserService = (email, code, callback) => {
    if (!email || !code) return callback({ error: 'Email and code are required' });
    if (verificationCodes[email] != code) return callback({ error: "Invalid verification code" });

    const userData = pendingUsers[email];
    if (!userData) return callback({ error: "No registration found for this email" });

    bcrypt.hash(userData.password, 10, (hashErr, hash) => {
        if (hashErr) return callback({ error: "Password hashing failed" });

        const user = {
            fullName: userData.fullName,
            email: userData.email,
            password: hash,
            role: userData.role
        };

        pool.query("INSERT INTO users SET ?", user, (insertErr) => {
            if (insertErr) return callback({ error: "Failed to register user" });

            // If preloaded admin → mark as registered
            if (user.role === 'admin') {
                pool.query(
                    "UPDATE preloadedAdmins SET isRegistered = true WHERE pre_admin_email = ?",
                    [email],
                    (updateErr) => {
                        if (updateErr) console.error("Failed to mark preloaded admin as registered:", updateErr.message);
                        else console.log(`Preloaded admin ${email} marked as registered`);
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

// Login service
export const loginUserService = (email, password, callback) => {
    if (!email || !password) return callback({ error: 'Email and password are required' });

    pool.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
        if (error) return callback({ error: "Database error" });
        if (results.length === 0) return callback({ message: "User does not exist, please register" });

        const user = results[0];

        bcrypt.compare(password, user.password, (err, passwordMatch) => {
            if (err) return callback({ error: "Password comparison failed" });
            if (!passwordMatch) return callback({ error: "Incorrect password" });

            const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
            const refreshToken = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            callback(null, {
                message: "User login successful",
                email: user.email,
                role: user.role,
                token: token,
                refreshToken: refreshToken
            });
        });
    });
};
