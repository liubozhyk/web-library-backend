import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
dotenv.config()

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET)

            req.userId = decoded._id;
        } catch (error) {
            console.log(error);
            return res.status(403).json({
                message: 'Permission denied!'
            })
        }
        next();
    } else {
        return res.status(403).json({
            message: 'Permission denied!'
        })
    }
}