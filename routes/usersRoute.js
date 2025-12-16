import express from 'express';
import { register, login, getMe, updateMe, userUpload, deleteUser, deleteLoanFromUser, getAllUsers, requestPasswordReset, confirmPasswordReset } from '../controllers/UserController.js'
import checkAuth from '../middleware/checkAuth.js';
import checkAdminAuth from '../middleware/checkAdminAuth.js';

export const usersRouter = express.Router();

usersRouter.post('/auth/register', userUpload.none(), register);
usersRouter.post('/auth/login', userUpload.none(), login);
usersRouter.post('/auth/password/reset/request', userUpload.none(), requestPasswordReset);
usersRouter.post('/auth/password/reset/confirm', userUpload.none(), confirmPasswordReset);
usersRouter.get('/me', checkAuth, getMe);
usersRouter.patch('/me', checkAuth, userUpload.single('avatarImage'), updateMe);
usersRouter.delete('/me', checkAuth, deleteUser);
usersRouter.delete('/:id/admin', checkAuth, checkAdminAuth, deleteUser);
usersRouter.get('/', checkAuth, checkAdminAuth, getAllUsers);
usersRouter.delete('/loans/:loanId/admin', checkAuth, checkAdminAuth, deleteLoanFromUser);