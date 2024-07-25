import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];
  // Fetch videos only that are set isPublished as true
  pipeline.push({ $match: { isPublished: true } });

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$ownerDetails",
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        createdAt: 1,
        updatedAt: 1,
        isPublished: 1,
        views: 1,
      },
    }
  );
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { "owner.username": { $regex: query, $options: "i" } },
        ],
      },
    });
  }




  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 9),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "video is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Failed to upload video file");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    duration: videoFile.duration,
    owner: req.user?._id,
    isPublished: false,
  });

  const videoUploaded = await Video.findById(video?._id);

  if (!videoUploaded) {
    throw new ApiError(500, "video uplodation failed Please Try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded Succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const videoFound = await Video.findById(videoId);

  if (!videoFound) {
    throw new ApiError(404, "Video not found");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscribers",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscibersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id:1,
              username: 1,
              avatar: 1,
              subscibersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        createdAt: 1,
        views: 1,
        likesCount: 1,
        isLiked: 1,
        thumbnail:1,
      },
    },
  ]);

  if (!video) {
    return res.status(404).json({ message: "Video not found" });
  }

  //increment views if video fetched succesfully

  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  //add the video to watch history

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    return res.status(400).json({ message: "Invalid video id" });
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json({ message: "Video not found" });
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    return res
      .status(403)
      .json({ message: "you cant delete this video as you are not owner" });
  }

  const videoUrl = video.videoFile;
  const thumbnailUrl = video.thumbnail;

  if (!videoUrl) {
    return res.status(400).json({ message: "video url not found" });
  }
  if (!thumbnailUrl) {
    return res.status(400).json({ message: "thumbnail url not found" });
  }

  const videoDeleted = await Video.findByIdAndDelete(videoId);

  if (!videoDeleted) {
    return res.status(404).json({ message: "video not found" });
  }

  const getPublicIdFromUrl = (url) => {
    const parts = url.split("/");
    const filename = parts.pop();
    const publicId = filename.split(".")[0];
    return publicId;
  };

  const videoPublicId = getPublicIdFromUrl(videoUrl);
  const thumbnailPublicId = getPublicIdFromUrl(thumbnailUrl);

  // console.log(videoPublicId);
  // console.log(thumbnailPublicId);

  await deleteFromCloudinary(videoPublicId, "video");
  await deleteFromCloudinary(thumbnailPublicId);

  //delete video likes

  await Like.deleteMany({
    video: videoId,
  });

  //delete video comments

  await Comment.deleteMany({
    video: videoId,
  });

  // Remove video from users' watch history
  // await User.updateMany(
  //   { watchHistory: videoId },
  //   { $pull: { watchHistory: videoId } }
  // );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;

  if (!(title && description)) {
    throw new ApiError(400, "title and description are required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const previousUrl = video.thumbnail;

  let thumbnailLocalPath;
  if (req.file?.path) {
    thumbnailLocalPath = req.file?.path;
  }

  let uploadedThumbnail;
  if (thumbnailLocalPath) {
    uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!uploadedThumbnail) {
      throw new ApiError(500, "Error uploading thumbnail");
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: uploadedThumbnail?.url || previousUrl,
    },
    { new: true }
  );

  if (!updateVideo) {
    throw new ApiError(500, "Error updating video");
  }

  if (thumbnailLocalPath) {
    const getPublicIdFromUrl = (url) => {
      const parts = url.split("/");
      const filename = parts.pop();
      const publicId = filename.split(".")[0];
      return publicId;
    };

    await deleteFromCloudinary(getPublicIdFromUrl(previousUrl));
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated Succesfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid video Id");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cant toggle Publish Status as you are not an owner"
    );
  }

  const toggledPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  if (!toggledPublishStatus) {
    throw new ApiError(500, "Error toggling publish status");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: toggledPublishStatus.isPublished },
        "Video publish toggled successfully"
      )
    );
});

export {
  publishAVideo,
  getVideoById,
  deleteVideo,
  updateVideo,
  getAllVideos,
  togglePublishStatus,
};
