import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import multer from "multer";
import path from 'path';

dotenv.config();

const userStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/users');
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
        const hash = await bcrypt.hash(password, salt);

        const User_collection = new User(
            {
                username: req.body.username,
                email: req.body.email,
                passwordHash: hash
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
        res.status(401).json({
            message: `Unsuccessful login!`
        });
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({
                message: 'Not found!'

            });
        }
        const { passwordHash, ...userData } = user._doc;
        res.json({ userData });

    } catch (error) {
        res.status(401).json({
            message: `Unsuccessful user!`
        });
    }
}

export const updateMe = async (req, res) => {
    try {
        let avatarImageUrl = '';
        const password = req.body.password;
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));
        const hash = await bcrypt.hash(password, salt);

        const user = await User.findById(req.userId)

        if (req.file) {
            if (avatarImageUrl !== '') {
                await fsPromises.rm(user.avatarUrl).then(console.log(`deletion complete`));
            }
            avatarImageUrl = req.file.path;
        }

        await User.updateOne(
            {
                _id: req.userId
            },
            {
                username: req.body.username,
                email: req.body.email,
                password: hash,
                avatarUrl: avatarImageUrl
            }
        )

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
        res.status(404).json({
            message: 'Unsuccessful update!'
        });
    }
}

export const addBookToWishlist = async (req, res) => {
    const bookId = req.params.bookId;

    try {
        await User.updateOne(
            { _id: req.userId },
            { $addToSet: { wishlist: { bookId } } }
        )

        return res.status(200).json({ message: 'Added successfully!' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error adding book to wishlist!' })
    }
}

export const removeFromWishlist = async (req, res) => {
    const bookId = req.params.bookId;

    try {
        await User.updateOne(
            { _id: req.userId },
            { $pull: { wishlist: { bookId } } }
        )

        return res.status(200).json({ message: 'Removed successfully!' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error removing book to wishlist!' })
    }
}