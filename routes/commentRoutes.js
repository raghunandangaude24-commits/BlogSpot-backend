const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    addComment,
    deleteComment
} = require("../controllers/commentController");

router.post("/:postId", authMiddleware, addComment);

router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;