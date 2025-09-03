import express from 'express';
import pool from './config/dbConfig.js';

const app = express();
const port = process.env.PORT || 3030;

app.listen((port), () => {
    console.log(`server running on port ${port}`);
});
