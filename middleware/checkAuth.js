import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
dotenv.config()

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    req.userAuth = false;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET)

            req.userId = decoded._id;
            req.userAuth = true;
        } catch (error) {
            console.log(error);
        }
    }
    next();
}