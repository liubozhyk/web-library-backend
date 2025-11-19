import Book from '../models/Book.js'
import multer from "multer";
import path from 'path';

const bookStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/books')
    },
    filename: (req, file, cb) => {
        cb(null, 'book_' + Date.now() + path.extname(file.originalname))
    }
})

export const bookUpload = multer({ storage: bookStorage })

export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();

        res.json(books);
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Books aren\'t found'
        })
    }
}

export const getOneBookInfo = async (req, res) => {
    try {
        const bookId = req.params.id;

        Book.findOneAndUpdate(
            {
                _id: bookId,
            },
            {
                $inc: { viewCount: 1 }
            },
            {
                returnDocument: 'after',
            },
            (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: 'Unable to update!'
                    });
                }
                if (!doc) {
                    return res.status(404).json({
                        message: 'Book isn\'t found'
                    });
                }
            }
        ).populate({
            path: 'reviews.user',
            select: 'username'
        }).exec()
            .then(book => { res.json(book) })
            .catch(err => {
                console.log(err);
                res.status(404).json({
                    message: 'Book isn\'t found'
                })
            })
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Book isn\'t found'
        })
    }
}

// Think about how to connect multer to download file + update a download counter
export const getOneBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        Book.findOneAndUpdate(
            {
                _id: bookId,
            },
            {
                $inc: { dowloadCount: 1 }
            },
            {
                returnDocument: 'after',
            },
            (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: 'Unable to update!'
                    })
                }
                if (!doc) {
                    return res.status(404).json({
                        message: 'Book isn\'t found'
                    })
                }
            }
        ).populate({
            path: 'reviews.user',
            select: 'username'
        }).exec()
            .then(book => { res.json(book) })
            .catch(err => {
                console.log(err);
                res.status(404).json({
                    message: 'Book isn\'t found'
                })
            })
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Book isn\'t found'
        })
    }
}

// Think about creation/deletion/udpating of book by admin
export const createBook = async (req, res) => {

}

export const deleteBook = async (req, res) => {

}

export const updateBook = async (req, res) => {

}

