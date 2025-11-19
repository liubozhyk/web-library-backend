import multer from "multer";
import path from 'path';
import { promises as fs } from "fs";
import Post from "../models/Post.js"

const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/posts')
    },
    filename: (req, file, cb) => {
        cb(null, 'post_' + Date.now() + path.extname(file.originalname))
    }
})

export const postUpload = multer({ storage: postStorage });

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find();

        if (!posts) {
            return res.status(404).json({
                message: 'Posts aren\'t found'
            })
        }

        res.json(posts);
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Posts aren\'t found'
        })
    }
}

export const getOnePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Posts aren\'t found'
            })
        }

        res.json(post);
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Post isn\'t found'
        })
    }
}

export const createPost = async (req, res) => {
    try {
        let postImagePath = '';
        if (req.file) {
            postImagePath = req.file.path;
        }

        const Post_collection = new Post({
            title: req.body.title,
            markdownContent: req.body.markdownContent,
            imageUrl: postImagePath
        })

        const post = await Post_collection.save();
        res.json(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Unsuccessful creation!`
        })
    }
}

export const deleteOnePost = async (req, res) => {
    try {
        const postId = req.params.id;
        await Post.findByIdAndDelete(postId);

        res.json({
            message: 'success!!',
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Unsuccessful deletion!'
        });
    }
}

export const updateOnePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post is\'t found!' });
        }

        let postImagePath = post.imageUrl;

        if (req.file) {
            if (postImagePath !== '') {
                await fs.rm(post.imageUrl).then(console.log(`deletion complete`));
            }
            postImagePath = req.file.path;
        }

        await Post.findByIdAndUpdate(
            {
                _id: postId,
            },
            {
                title: req.body.title,
                markdownContent: req.body.markdownContent,
                imageUrl: postImagePath
            }
        );
        res.json({
            message: 'success!!',
        });

    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: 'Unsuccessful update!'
        });
    }
}