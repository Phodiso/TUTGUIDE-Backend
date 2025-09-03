import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

//create connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_SERVER_NAME,
    database: process.env.DB_NAME
});

pool.getConnection((error, connection) => {
    if(error){
        console.log("DB failed to connect", error.message);
    }else{
        console.log("DB connected!");
    }

    
    connection.release();
});

export default pool;