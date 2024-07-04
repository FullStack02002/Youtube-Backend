import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Reply } from "../models/reply.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const likeAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (likeAlready) {
    await Like.findByIdAndDelete(likeAlready?._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const likeAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (likeAlready) {
    await Like.findByIdAndDelete(likeAlready?._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const likeAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (likeAlready) {
    await Like.findByIdAndDelete(likeAlready?._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleReplyLike = asyncHandler(async (req, res) => {
  const { replyId } = req.params;

  if (!replyId) {
    throw new ApiError(400, "Invalid reply id");
  }

  const reply = Reply.findById(replyId);

  if (!reply) {
    throw new ApiError(404, "Reply not found");
  }
  const likeAlready = await Like.findOne({
    reply: replyId,
    likedBy: req.user?._id,
  });

  if (likeAlready) {
    await Like.findByIdAndDelete(likeAlready?._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    reply: replyId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideosAggegate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideosAggegate,
                "liked videos fetched successfully"
            )
        );
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleReplyLike,
  toggleTweetLike,
  getLikedVideos,
}
