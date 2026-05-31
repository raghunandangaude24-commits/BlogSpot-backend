const Comment = require("../models/Comment");

exports.addComment = async (req, res) => {
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
};

exports.deleteComment = async (req, res) => {
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
};