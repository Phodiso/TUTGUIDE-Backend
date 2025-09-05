// tables/createTables.js
import pool from '../config/dbConfig.js';

export async function createTables() {
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
      if (error) console.log("Failed to create posts table.", error.message);
      else console.log("Posts table created.");
    }
  );
}
