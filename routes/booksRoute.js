import { getAllBooks, downloadOneBook, getOneBook, createBook, deleteBook, updateBook, bookUpload, getBookPreview, borrowBook, addToWishlist, removeFromWishlist, commentBook, updateComment, deleteComment, deleteCommentByAdmin } from '../controllers/BookController.js'
import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import checkAdminAuth from '../middleware/checkAdminAuth.js';

export const booksRouter = express.Router();

booksRouter.get('/', getAllBooks);
booksRouter.get('/:id', checkAuth, getOneBook);
booksRouter.get('/:id/file', checkAuth, downloadOneBook);
booksRouter.get('/:id/preview', getBookPreview);
booksRouter.post('/:id/addToWishlist', checkAuth, addToWishlist);
booksRouter.post('/:id/removeFromWishlist', checkAuth, removeFromWishlist);
booksRouter.post('/:id/comments/new', bookUpload.none(), checkAuth, commentBook);
booksRouter.patch('/:id/comments/:commentId', bookUpload.none(), checkAuth, updateComment);
booksRouter.delete('/:id/comments/:commentId', checkAuth, deleteComment);
booksRouter.post('/:id/borrow', checkAuth, borrowBook);
booksRouter.post('/new', checkAuth, checkAdminAuth, bookUpload.single('bookFile'), createBook);
booksRouter.delete('/:id', checkAuth, checkAdminAuth, deleteBook);
booksRouter.patch('/:id', checkAuth, checkAdminAuth, updateBook);
booksRouter.delete('/:id/comments/:commentId/admin', checkAuth, checkAdminAuth, deleteCommentByAdmin);