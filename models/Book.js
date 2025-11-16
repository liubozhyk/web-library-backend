import mongoose from "mongoose";

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
        genre: {
            type: String,
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
        viewCount: {
            type: Number,
            default: 0
        },
        dowloadCount: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Double,
            default: 0
        },
    },
    { timestamps: true }
);

export default mongoose.model('Book', BookSchema);