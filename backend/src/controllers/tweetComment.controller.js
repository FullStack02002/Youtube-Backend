import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";

const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Not Found");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.create({
    content,
    owner: req.user?._id,
    tweet: tweetId,
  });

  if (!comment) {
    throw new ApiError(500, "Error in Adding Comment Try Again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added to Tweet Succesfully"));
});

const deleteTweetComment = asyncHandler(async (req, res) => {
  const { tweetCommentId } = req.params;
  if (!isValidObjectId(tweetCommentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const tweetComment = await Comment.findById(tweetCommentId);

  if (!tweetComment) {
    throw new ApiError(404, "Comment Not Found");
  }

  if (tweetComment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can delete this tweet comment");
  }

  await Comment.findByIdAndDelete(tweetCommentId);

  await Like.deleteMany({
    comment: tweetCommentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweetCommentId, "Tweet Comment Deleted Succesfully")
    );
});

const updateTweetComment = asyncHandler(async (req, res) => {
  const { tweetCommentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetCommentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const comment = await Comment.findById(tweetCommentId);
  if (!comment) {
    throw new ApiError(404, "Tweet Comment Not Found");
  }

  if(comment?.owner.toString()!==req.user?._id.toString()){
    throw new ApiError(400,"Only owner of this comment can update this comment");
  }

  const updatedComment=await Comment.findByIdAndUpdate(tweetCommentId,{
    $set:{
        content
    }
  },{new:true})


  if(!updatedComment){
    throw new ApiError(404,"Error in updating tweet comment");
  }


  return res.status(200).json(new ApiResponse(200,updatedComment,"Comment Updated Successfully"))


});


const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet Not Found");
    }

    const tweetCommentAggregate = Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const tweetComments = await Comment.aggregatePaginate(tweetCommentAggregate, options);

    return res.status(200).json(new ApiResponse(200, tweetComments, "Tweet Comment Fetched Successfully"));
});

export { addTweetComment, deleteTweetComment,updateTweetComment,getTweetComments };
