import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: "normis"
        },
        avatarUrl: String,
        wishlist: [{
            bookId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
                required: true
            }
        }],
        activeLoans: [{
            bookId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
                required: true
            },
            loanDate: {
                type: Date,
                default: Date.now,
            },
            dueDate: {
                type: Date,
                default: () => new Date(Date.now + 14 * 24 * 60 * 60 * 1000),
            }
        }],
        viewHistory: [{
            bookId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
                required: true
            },
            ViewedDate: {
                type: Date,
                default: Date.now
            }
        }],
    },
    { timestamps: true }
);

export default mongoose.model('User', UserSchema);