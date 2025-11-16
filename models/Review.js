import mongoose from "mongoose";

const ReviewSchema = mongoose.Schema(
    {
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        rating: {
            type: Double,
            required: true,
        },
        comment: {
            type: String,
            required: true
        },
    },
    { timestamps: true }
);

export default mongoose.model('Review', ReviewSchema);