const Post = require("../models/Post");
const Comment = require("../models/Comment");

exports.createPost = async (req, res) => {
    try {

        const { title, content, image } = req.body;

        const post = new Post({
            title,
            content,
            image,
            author: req.user.username,
            userId: req.user.id
        });

        await post.save();

        res.status(201).json({
            message: "Post created successfully",
            post
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
};

exports.getAllPosts = async (req, res) => {
    try {

        const posts = await Post.find()
            .sort({ createdAt: -1 });

        res.json(posts);

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
};

exports.getSinglePost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const comments = await Comment.find({
            postId: post._id
        }).sort({ createdAt: -1 });

        res.json({
            post,
            comments
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
};

exports.updatePost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({
            message: "Post updated",
            updatedPost
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
};

exports.deletePost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        await Comment.deleteMany({
            postId: req.params.id
        });

        res.json({
            message: "Post deleted"
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
};