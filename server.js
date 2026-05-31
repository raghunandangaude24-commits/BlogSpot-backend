// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================= APP =================
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= MONGODB CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

// ================= USER SCHEMA =================
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("User", userSchema);

// ================= POST SCHEMA =================
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    author: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Post = mongoose.model("Post", postSchema);

// ================= COMMENT SCHEMA =================
const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Comment = mongoose.model("Comment", commentSchema);

// ================= AUTH MIDDLEWARE =================
const authMiddleware = async (req, res, next) => {

    try {

        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const verified = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.JWT_SECRET
        );

        req.user = verified;

        next();

    } catch (error) {
        res.status(401).json({
            message: "Invalid token"
        });
    }
};

// ================= HOME ROUTE =================
app.get("/", (req, res) => {
    res.send("BlogSpot Backend Running...");
});

// ================= REGISTER =================
app.post("/api/auth/register", async (req, res) => {

    try {

        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
});

// ================= LOGIN =================
app.post("/api/auth/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            token,
            username: user.username,
            userId: user._id
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
});

// ================= CREATE POST =================
app.post("/api/posts", authMiddleware, async (req, res) => {

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
});

// ================= GET ALL POSTS =================
app.get("/api/posts", async (req, res) => {

    try {

        const posts = await Post.find()
            .sort({ createdAt: -1 });

        res.json(posts);

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
});

// ================= GET SINGLE POST =================
app.get("/api/posts/:id", async (req, res) => {

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
});

// ================= UPDATE POST =================
app.put("/api/posts/:id", authMiddleware, async (req, res) => {

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
});

// ================= DELETE POST =================
app.delete("/api/posts/:id", authMiddleware, async (req, res) => {

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
});

// ================= ADD COMMENT =================
app.post("/api/comments/:postId", authMiddleware, async (req, res) => {

    try {

        const { text } = req.body;

        const comment = new Comment({
            postId: req.params.postId,
            username: req.user.username,
            text
        });

        await comment.save();

        res.status(201).json({
            message: "Comment added",
            comment
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
});

// ================= DELETE COMMENT =================
app.delete("/api/comments/:id", authMiddleware, async (req, res) => {

    try {

        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.username !== req.user.username) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({
            message: "Comment deleted"
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        });
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});