import dotenv from 'dotenv';
import User from '../models/User.js';

export default async (req, res, next) => {
    try {
        const adminUser = await User.findById(req.userId);

        if (!adminUser) {
            return res.status(401).json({
                message: 'Invalid password or login!'
            });
        }

        if (adminUser.role === 'admin') {
            next();
        } else {
            res.status(403).json({
                message: 'No rights to make it!'
            })
        }

    } catch (error) {
        res.status(500).json({
            message: 'Error in db!'
        })
    }

}