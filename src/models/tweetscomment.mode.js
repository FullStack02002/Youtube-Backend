import mongoose, { Schema } from "mongoose";

const tweetCommentSchema = new Schema({
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: 'Tweet',
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export const TweetComment = mongoose.model("TweetComment", tweetCommentSchema);
