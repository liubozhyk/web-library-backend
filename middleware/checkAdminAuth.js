import User from '../models/User.js';

export default async (req, res, next) => {
    try {
        req.isAdminAuth = false;
        const adminUser = await User.findById(req.userId);

        if (!adminUser) {
            return res.status(401).json({
                message: 'Invalid password or login!'
            });
        }

        if (adminUser.role === 'admin') {
            req.isAdminAuth = true;
            next();
        } else {
            res.status(403).json({
                message: 'No rights to do it!'
            })
        }

    } catch (error) {
        res.status(500).json({
            message: 'Error in db!'
        })
    }
}