import User from '../models/User.js';
import Book from '../models/Book.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import multer from "multer";
import path from 'path';
import nodemailer from 'nodemailer';
import { promises as fsPromises } from 'fs';

dotenv.config();

const mailTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

const userStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/userAvatars/');
    },
    filename: (req, file, cb) => {
        cb(null, 'user_' + Date.now() + path.extname(file.originalname));
    }
})

export const userUpload = multer({ storage: userStorage });

export const register = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));
        const hash = await bcrypt.hash(password.toString(), salt);

        const User_collection = new User(
            {
                username: req.body.username,
                email: req.body.email,
                passwordHash: hash,
            }
        );
        const user = await User_collection.save();

        const token = jwt.sign(
            {
                _id: user._id,
            },
            process.env.SECRET,
            {
                expiresIn: '30d'
            }
        );

        const { passwordHash, ...userData } = user._doc;
        res.json({ userData, token })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Unsuccessful register!`
        })
    }
}

export const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                message: 'Invalid password or login!'
            });
        }

        const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if (!isValidPass) {
            return res.status(403).json({
                message: 'Invalid password or login!'
            });
        }

        const token = jwt.sign(
            {
                _id: user._id,
            },
            process.env.SECRET,
            {
                expiresIn: '30d'
            }
        );

        const { passwordHash, ...userData } = user._doc;
        res.json({ userData, token })
    } catch (error) {
        console.log(error);
        res.status(401).json({
            message: `Unsuccessful login!`
        });
    }
}

export const getMe = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const user = await User.findById(req.userId)
            .select('-passwordHash')
            .populate({ path: 'activeLoans.bookId', select: 'title author coverImageUrl averageRating publisher availableAmount' })
            .populate({ path: 'wishlist.bookId', select: 'title author coverImageUrl averageRating publisher availableAmount' })
            .populate({ path: 'viewHistory.bookId', select: 'title author coverImageUrl averageRating publisher availableAmount' })
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'Not found!' });
        }

        return res.json({ userData: user });
    } catch (error) {
        console.log(error);
        res.status(401).json({
            message: `Unsuccessful user!`
        });
    }
}

export const updateMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        let avatarImageUrl = user.avatarUrl || '';
        if (req.file) {
            if (avatarImageUrl) {
                await fsPromises.rm(user.avatarUrl).catch(() => { });
            }
            avatarImageUrl = req.file.path;
        }

        let updatedPasswordHash = user.passwordHash;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));
            updatedPasswordHash = await bcrypt.hash(req.body.password, salt);
        }

        await User.updateOne(
            { _id: req.userId },
            {
                username: req.body.username || user.username,
                email: req.body.email || user.email,
                passwordHash: updatedPasswordHash,
                avatarUrl: avatarImageUrl
            }
        );

        const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn: '30d' });
        const { passwordHash, ...userData } = { ...user._doc, avatarUrl: avatarImageUrl };
        res.json({ userData, token })
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Unsuccessful update!'
        });
    }
}

export const deleteUser = async (req, res) => {
    const userToDelete = (req.params.id && req.isAdminAuth) ? req.params.id : req.userId;

    try {
        const user = await User.findByIdAndDelete(
            { _id: userToDelete }
        );


        if (!user) {
            return res.status(404).json({
                message: 'User not found!'
            });
        }

        res.json({
            message: 'User deleted successfully!'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Unsuccessful deletion!'
        });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate({ path: 'activeLoans.bookId', select: 'title' }).select('-passwordHash').exec();
        return res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Unsuccessful retrieval of users!'
        });
    }
}

export const deleteLoanFromUser = async (req, res) => {
    try {
        const loanId = req.params.loanId;
        const user = await User.findOne({ 'activeLoans._id': loanId });

        if (!user) {
            return res.status(404).json({ message: 'Loan not found for user.' });
        }

        const loan = user.activeLoans.id(loanId);
        const bookId = loan?.bookId;

        await User.updateOne(
            { _id: user._id },
            { $pull: { activeLoans: { _id: loanId } } }
        );

        if (bookId) {
            await Book.updateOne(
                { _id: bookId },
                { $inc: { availableAmount: 1 } }
            );
        }

        return res.status(200).json({ message: 'Loan deleted successfully!' });
    } catch (error) {
        console.log('Error deleting loan from user:', error);
        res.status(500).json({ message: 'Error deleting loan.' });
    }
}

const generateResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: 'If the email exists, a code was sent.' });
        }

        const code = generateResetCode();
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));
        const resetCodeHash = await bcrypt.hash(code, salt);

        user.resetCodeHash = resetCodeHash;
        user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const mailOptions = {
            from: process.env.NODEMAILER_FROM || process.env.NODEMAILER_EMAIL,
            to: user.email,
            subject: 'Код для скидання паролю',
            html: `<p>Ваш код для скидання паролю: <strong>${code}</strong></p><p>Код діє 15 хвилин.</p>`,
            text: `Ваш код для скидання паролю: ${code}. Код діє 15 хвилин.`
        };

        await mailTransporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'If the email exists, a code was sent.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Unable to send reset code.' });
    }
};

export const confirmPasswordReset = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user || !user.resetCodeHash || !user.resetCodeExpires) {
            return res.status(400).json({ message: 'Invalid or expired code.' });
        }

        if (user.resetCodeExpires < new Date()) {
            return res.status(400).json({ message: 'Code expired.' });
        }

        const isCodeValid = await bcrypt.compare(code, user.resetCodeHash);
        if (!isCodeValid) {
            return res.status(400).json({ message: 'Invalid code.' });
        }

        const tempPassword = generateTempPassword();
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));
        user.passwordHash = await bcrypt.hash(tempPassword, salt);
        user.resetCodeHash = undefined;
        user.resetCodeExpires = undefined;
        await user.save();

        const mailOptions = {
            from: process.env.NODEMAILER_FROM || process.env.NODEMAILER_EMAIL,
            to: user.email,
            subject: 'Ваш новий тимчасовий пароль',
            html: `<p>Ваш тимчасовий пароль: <strong>${tempPassword}</strong></p><p>Увійдіть з ним і змініть пароль у профілі.</p>`,
            text: `Ваш тимчасовий пароль: ${tempPassword}. Увійдіть з ним і змініть пароль у профілі.`
        };

        await mailTransporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'Password reset. Check your email for the new password.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Unable to reset password.' });
    }
};