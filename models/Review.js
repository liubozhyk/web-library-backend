import mongoose from "mongoose";

const ReviewSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        comment: {
            type: String,
            required: true
        },
    },
    { timestamps: true }
);

export default ReviewSchema;