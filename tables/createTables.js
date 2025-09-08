// tables/createTables.js
import pool from '../config/dbConfig.js';

export async function createTables() {
  // Create users table
  pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      fullName VARCHAR(100),
      email VARCHAR(200) PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      profile_picture MEDIUMBLOB,
      role ENUM('user','admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    (error) => {
      if (error) console.log("Failed to create users table.", error.message);
      else console.log("Users table created.");
    }
  );

  // Create feedback table
  pool.query(
    `CREATE TABLE IF NOT EXISTS feedback (
      feedback_id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(200),
      feedback_message TEXT NOT NULL,      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE
    )`,
    (error) => {
      if (error) console.log("Failed to create feedback table.", error.message);
      else console.log("Feedback table created.");
    }
  );

  // Create preloadedAdmins table and insert default admins
  pool.query(
    `CREATE TABLE IF NOT EXISTS preloadedAdmins (
      pre_admin_id INT AUTO_INCREMENT PRIMARY KEY,
      pre_admin_email VARCHAR(200) NOT NULL UNIQUE,
      isRegistered BOOLEAN DEFAULT false      
    )`,
    (error) => {
      if (error) console.log("Failed to create preloadedAdmins table.", error.message);
      else {
        console.log("PreloadedAdmins table created.");

        // Preload admins
        const defaultAdmins = [
          "inocentsipho@gmail.com",
          "chantellemmathabo4@gmail.com",
          "molebogengramushu48@gmail.com",
          "byronmathole@gmail.com",
          "yamkelazele@gmail.com",
          "lindelwanonjabulo00@gmail.com"
        ];

        defaultAdmins.forEach((email) => {
          pool.query(
            "INSERT IGNORE INTO preloadedAdmins (pre_admin_email) VALUES (?)",
            [email],
            (error) => {
              if(error){
                console.error(`Failed to insert ${email}:`, error.message);
              } else {
                console.log(`Preloaded admin inserted: ${email}`);
              }
            }
          );
        });
      }
    }
  );
}
