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

    //validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return callback({ error: "Invalid email format" });
    }


    //test if the user exists
    pool.query("SELECT * FROM users WHERE email = ?", 
        [email], 
        (error, results) => {
        if (error) {
            console.error("DB error:", error.message);
            return callback({ error: "Database error" });
        }

        if (results.length > 0) {
            return callback({ error: "User already exists" });
        }

        //generate verification code
        const code = Math.floor(1000 + Math.random() * 9000);
        verificationCodes[email] = code;

        //store user to pending users
        pendingUsers[email] = { fullName, email, password, role: role || 'user' };

        sendVerificationEmail(email, code, (error) => {
            if(error){
                return callback({ error: "Failed to send email", details: error.message});
            }

            console.log(`Verification code for ${email}: ${code}`);
            callback(null, { message: 'Verification code sent to your email' });
        });

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

            delete verificationCodes[email];
            delete pendingUsers[email];        

            callback(null, {
                message: "User verified and registered successfully",
                user/*: { email: user.email, name: user.name, surname: user.surname, role: user.role }*/
            });
            
        });
    });
};


//logging in
export const loginUserService = (email, password, callback) => {
    if (!email || !password) {
        return callback({ error: 'Email and password are required' });
    }

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
                role: user.role,
                token,
                refreshToken
            });
        });

        }
    );
};