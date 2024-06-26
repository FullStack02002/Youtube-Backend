import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

//create tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please provide content");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to Create Tweet Try Again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet Created Succesfully"));
});

//delete tweet

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Not Found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Only tweet owner can delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, { tweetId }, "tweet Deleted Succesfully"));
});

//update tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Not Found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can edit their tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updateTweet) {
    throw new ApiError(500, "Failed to Update Tweet Try Again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "tweet updated Succesfully"));
});

//getUsersTweet

const getUsersTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        avatar:1
                    }
                }
            ]
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"id",
            foreignField:"tweet",
            as:"likes"
        }
    },{
        $addFields:{
            likesCount:{
                $size:"$likes"
            },
            owner:{
                $first:"$owner"
            },
            isLiked:{
                $cond:{
                    if:{$in:[req.user?._id,"$likes.likedBy"]},
                    then:true,
                    else:false
                }
            }
        }
    },{
        $sort:{
            createdAt:-1
        }
    },{
        $project:{
            content:1,
            createdAt:1,
            owner:1,
            likesCount:1
        }
    }
  ]);

  return res.status(200).json(new ApiResponse(200,tweets,"Tweets Fetched Successfully"))
});

export { createTweet, deleteTweet, updateTweet,getUsersTweet };
