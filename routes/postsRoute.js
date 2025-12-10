import { getAllPosts, getOnePost, createPost, deleteOnePost, updateOnePost, postUpload } from "../controllers/PostController.js";
import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import checkAdminAuth from '../middleware/checkAdminAuth.js';

export const postsRouter = express.Router();

postsRouter.get('/', getAllPosts);
postsRouter.get('/:id', getOnePost);
postsRouter.post('/new', checkAuth, checkAdminAuth, postUpload.single('postImage'), createPost);
postsRouter.patch('/:id', checkAuth, checkAdminAuth, postUpload.single('postImage'), updateOnePost);
postsRouter.delete('/:id', checkAuth, checkAdminAuth, deleteOnePost);