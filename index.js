import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { loansScheduler } from './schedulers/LoansEmailScheduler.js';
import { usersRouter } from './routes/usersRoute.js';
import { booksRouter } from './routes/booksRoute.js';
import { postsRouter } from './routes/postsRoute.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        loansScheduler();
    })
    .catch((err) => console.error(err));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/books', booksRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});