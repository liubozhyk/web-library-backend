import Book from '../models/Book.js'
import User from '../models/User.js';
import multer from "multer";
import { Poppler } from 'node-poppler';
import path from 'path';
import { promises as fsPromises } from "fs";
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bookStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/books')
    },
    filename: (req, file, cb) => {
        if (file.fieldname === 'bookFile') {
            cb(null, 'book_' + Date.now() + path.extname(file.originalname))
        } else if (file.fieldname === 'bookCoverImage') {
            cb(null, 'bookCover_' + Date.now() + path.extname(file.originalname))
        }
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

export const getBookPreview = async (req, res) => {
    try {
        const bookId = req.params.id;

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: 'Book preview isn\'t found'
            })
        }

        return res.sendFile(path.join(__dirname, '..', book.previewUrl));

    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Book preview isn\'t found'
        })
    }

}

export const getOneBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        if (req.userAuth) {
            const userId = req.userId;

            try {
                await User.updateOne(
                    { _id: userId },
                    { $push: { viewHistory: { bookId } } }
                );
            } catch (error) {
                console.log(error);
                res.status(500).json({ message: 'Error recording history!' })
            }
        }

        const book = await Book.findOneAndUpdate(
            {
                _id: bookId,
            },
            {
                $inc: { viewCount: 1 }

            },
            {
                returnDocument: 'after',
            },
        ).populate({
            path: 'reviews.userId',
            select: 'username'
        }).exec()
            .then(book => { res.json(book) })
            .catch(err => {
                console.log(err);
                res.status(404).json({
                    message: 'Book isn\'t found'
                })
            })
        res.json(book);
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Book isn\'t found'
        })
    }
}

export const downloadOneBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        const book = await Book.findOneAndUpdate(
            {
                _id: bookId,
            },
            {
                $inc: { downloadCount: 1 }
            },
            {
                returnDocument: 'after',
            });

        res.download(path.join(__dirname, '..', book.fileUrl));
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Book isn\'t found'
        })
    }
}

export const createBook = async (req, res) => {
    try {
        const genres = req.body.genres;
        const dataBuffer = new Uint8Array(await fsPromises.readFile(req.file.path));
        const coverImageUrl = path.join('uploads', 'bookCovers', `${path.basename(req.file.path, path.extname(req.file.path))}_cover.png`);
        const previewUrl = path.join('uploads', 'bookPreviews', `${path.basename(req.file.path, path.extname(req.file.path))}_preview.pdf`);
        const poppler = new Poppler();
        const parser = new PDFParse(dataBuffer);

        const optionsForCover = {
            pngFile: true,
            singleFile: true,
            firstPageToConvert: 1,
            lastPageToConvert: 1,
        };

        const optionsForPreview = {
            pdfFile: true,
            firstPageToConvert: 1,
            lastPageToConvert: 8
        }

        const parsedBook = await parser.getInfo({
            parsePageInfo: true
        })

        try {
            await poppler.pdfToCairo(req.file.path, path.join('uploads', 'bookCovers', `${path.basename(req.file.path, path.extname(req.file.path))}_cover`), optionsForCover);
            await poppler.pdfToCairo(req.file.path, path.join('uploads', 'bookPreviews', `${path.basename(req.file.path, path.extname(req.file.path))}_preview.pdf`), optionsForPreview);
        } catch (error) {
            console.log(error);
            res.status(500);
        };

        const Book_Collection = new Book({
            title: req.body.title,
            author: req.body.author,
            publisher: req.body.publisher,
            publicationYear: req.body.publicationYear,
            description: req.body.description,
            availableAmount: req.body.availableAmount,
            totalPages: parsedBook.total,
            genres: genres.split(', '),
            coverImageUrl: coverImageUrl,
            fileUrl: req.file.path,
            previewUrl: previewUrl
        });

        const book = await Book_Collection.save();
        return res.json(book);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Unsuccessful creation!`
        })
    }
}

export const deleteBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.findByIdAndDelete(bookId);

        await fsPromises.unlink(book.previewUrl);
        await fsPromises.unlink(book.coverImageUrl);
        await fsPromises.unlink(book.fileUrl);

        res.json({
            message: 'Successful delete!',
        });

    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Unsuccessful delete!'
        });
    }
}

export const updateBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({ message: 'Book isn\'t found!' });
        }

        await Book.updateOne(
            {
                _id: bookId
            },
            {
                title: req.body.title,
                author: req.body.author,
                publisher: req.body.publisher,
                publicationYear: req.body.publicationYear,
                description: req.body.description,
            }
        )

    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Unsuccessful update!'
        });
    }
}

export const addToWishlist = async (req, res) => {
    try {
        const bookId = req.params.id;
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
    try {
        const bookId = req.params.id;
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

export const borrowBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.findById(bookId);
        if (book.availableAmount <= 0) {
            return res.status(400).json({ message: 'Book isn\'t available to borrow!' })
        } else {
            await User.updateOne(
                { _id: req.userId },
                { $addToSet: { activeLoans: { bookId } } }
            ).catch(err => {
                console.log(err);
                res.status(500).json({ message: 'Error recording loan!' });
            });

            await Book.updateOne(
                { _id: bookId },
                { $inc: { availableAmount: -1 } }
            )
        }

        return res.status(200).json({ message: 'Book loaned successfully!' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error loaning book!' })
    }
}

export const commentBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const existingReview = await Book.findOne(
            { _id: bookId, 'reviews.userId': req.userId }
        );

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this book!' })
        }

        await Book.updateOne(
            { _id: bookId },
            {
                $push: {
                    reviews: {
                        userId: req.userId,
                        comment: req.body.comment,
                        rating: req.body.rating
                    }
                }
            },
        );

        await Book.updateOne(
            {
                _id: bookId,
            },
            [
                {
                    $set: { averageRating: { $avg: '$reviews.rating' } }
                }
            ],
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({ message: 'Comment added successfully!' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error commenting book!' })
    }
}

export const updateComment = async (req, res) => {
    try {
        const bookId = req.params.id;
        const commentId = req.params.commentId;
        const book = await Book.updateOne(
            { _id: bookId, 'reviews._id': commentId, 'reviews.userId': req.userId },
            {
                $set: {
                    'reviews.$.comment': req.body.comment,
                    'reviews.$.rating': req.body.rating
                }
            }
        );

        if (book.modifiedCount === 0) {
            return res.status(404).json({
                message: 'Comment not found or access denied (only the owner can update).'
            });
        }

        await Book.updateOne(
            { _id: bookId },
            [{ $set: { averageRating: { $avg: '$reviews.rating' } } }],
            { new: true, runValidators: true }
        );

        return res.status(200).json({ message: 'Comment updated successfully!' })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating comment!' })
    }
}

export const deleteComment = async (req, res) => {
    try {
        const bookId = req.params.id;
        const commentId = req.params.commentId;
        const book = await Book.updateOne(
            { _id: bookId, reviews: { _id: commentId, userId: req.userId } },
            { $pull: { reviews: { _id: commentId, userId: req.userId } } }
        );

        if (book.modifiedCount === 0) {
            return res.status(404).json({
                message: 'Comment not found or access denied (only the owner can delete).'
            });
        }

        await Book.updateOne(
            { _id: bookId },
            [{ $set: { averageRating: { $avg: '$reviews.rating' } } }],
            { new: true, runValidators: true }
        );

        return res.status(200).json({ message: 'Comment deleted successfully!' })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error deleting comment!' })
    }
}

export const deleteCommentByAdmin = async (req, res) => {
    try {
        const bookId = req.params.id;
        const commentId = req.params.commentId;

        const book = await Book.updateOne(
            { _id: bookId },
            { $pull: { reviews: { _id: commentId } } }
        );

        if (book.modifiedCount === 0) {
            return res.status(404).json({
                message: 'Comment not found.'
            });
        }

        await Book.updateOne(
            { _id: bookId },
            [{ $set: { averageRating: { $avg: '$reviews.rating' } } }],
            { new: true, runValidators: true }
        );

        return res.status(200).json({ message: 'Comment deleted successfully by admin!' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error deleting comment by admin!' })
    }
}