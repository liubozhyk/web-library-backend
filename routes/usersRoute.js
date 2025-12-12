import express from 'express';
import { register, login, getMe, updateMe, userUpload, deleteUser } from '../controllers/UserController.js'
import checkAuth from '../middleware/checkAuth.js';
import checkAdminAuth from '../middleware/checkAdminAuth.js';

export const usersRouter = express.Router();

usersRouter.post('/auth/register', userUpload.none(), register);
usersRouter.post('/auth/login', userUpload.none(), login);
usersRouter.get('/me', checkAuth, getMe);
usersRouter.patch('/me', checkAuth, userUpload.single('avatarImage'), updateMe);
usersRouter.delete('/me', checkAuth, deleteUser);
usersRouter.delete('/:id/admin', checkAuth, checkAdminAuth, deleteUser);