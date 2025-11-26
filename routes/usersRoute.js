import express from 'express';
import { register, login, getMe, updateMe, userUpload } from '../controllers/UserController.js'
import checkAuth from '../middleware/checkAuth.js';

export const usersRouter = express.Router();

usersRouter.post('/auth/register', register);
usersRouter.post('/auth/login', login);
usersRouter.get('/auth/me', checkAuth, getMe);
usersRouter.patch('/:id', checkAuth, userUpload.single('avatarImage'), updateMe);