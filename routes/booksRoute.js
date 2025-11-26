import { getAllBooks, downloadOneBook, getOneBook, createBook, deleteBook, updateBook, bookUpload } from '../controllers/BookController.js'
import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import checkAdminAuth from '../middleware/checkAdminAuth.js';

export const booksRouter = express.Router();

booksRouter.get('/', getAllBooks);
booksRouter.get('/:id', getOneBook);
booksRouter.get('/:id/file', downloadOneBook);
booksRouter.post('/new', checkAuth, checkAdminAuth, bookUpload.single('fileUrl'), createBook);
booksRouter.delete('/:id', checkAuth, checkAdminAuth, deleteBook);
booksRouter.patch('/:id', checkAuth, checkAdminAuth, updateBook);