import express from 'express';
import bodyParser from "body-parser";
import authRouter from './routes/authRoutes.js';
import { createTables } from './tables/createTables.js'


const app = express();
const port = process.env.PORT || 3030;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // or bodyParser.json()

//create tables
createTables();

//routes
app.use('/api/auth', authRouter);

app.listen((port), () => {
    console.log(`server running on port ${port}`);
});
