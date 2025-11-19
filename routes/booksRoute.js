import { getAllBooks, getOneBook, getOneBookInfo, createBook, deleteBook, updateBook, bookUpload } from '../controllers/BookController.js'
import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import checkAdminAuth from '../middleware/checkAdminAuth.js';

export const booksRouter = express.Router();

booksRouter.get('/', getAllBooks);
booksRouter.get('/:id', getOneBookInfo);
booksRouter.get('/:id/file', getOneBook);
booksRouter.post('/new', checkAuth, checkAdminAuth, createBook);
booksRouter.delete('/:id', checkAuth, checkAdminAuth, deleteBook);
booksRouter.patch('/:id', checkAuth, checkAdminAuth, updateBook);