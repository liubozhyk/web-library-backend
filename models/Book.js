import mongoose from "mongoose";
import reviews from './Review.js'

const BookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true
        },
        author: {
            type: String,
            required: true
        },
        publisher: {
            type: String,
            required: true
        },
        publicationYear: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        pageCount: {
            type: Number,
            required: true
        },
        genres: {
            type: [String],
            required: true
        },
        availableAmount: {
            type: Number,
            required: true
        },
        coverImageUrl: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        previewUrl: {
            type: String,
            required: true
        },
        viewCount: {
            type: Number,
            default: 0
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        reviews: {
            type: [reviews],
            default: []
        }
    },
    { timestamps: true }
);

export default mongoose.model('Book', BookSchema);