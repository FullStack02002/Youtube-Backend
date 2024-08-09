import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import {User} from "../models/user.model.js"
import { Video } from "../models/video.model.js";

//create Playlist
const createPlaylist = asyncHandler(async (req, res) => {
  const { name} = req.body;
  if(!name){
    throw new ApiError(400,"name is required");
  }

  const playlist = await Playlist.create({
    name,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Playlist not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Created Succesfully"));
});

//update Playlist
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name} = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if ([name, description].some((field) => field.trim() == "")) {
    throw new ApiError(400, "Please provide all fields");
  }
  if (req.user?._id.toString() !== playlist.owner.toString()) {
    throw new ApiError(403, "You are not authorized to perform this action");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name
      },
    },
    {
      new: true,
    }
  );

  if (!updatePlaylist) {
    throw new ApiError(500, "Playlist not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "Playlist Updated Succesfully"));
});

//delete Playlist

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findByIdAndUpdate(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "Only owner of this playlist can delete this playlist"
    );
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, playlistId, "Playlist Deleted Succesfully"));
});

//add video to playlist
const addVideotoPlaylist = asyncHandler(async (req, res) => {
  const { videoId,playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }
  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "Only owner of this playlist can add video to this playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(500, "Video not added to playlist Try Again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video Added To Playlist Succesfully"
      )
    );
});

//delete video from playlist

const deleteVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const playlist = await Playlist.findById(playlistId);

  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "Only owner of this playlist can delete video from this playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Video not deleted from playlist Try Again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video Deleted from Playlist Succesfully"
      )
    );
});

//get Playlist By Id

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const playlistAggregate = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
            $project: {
              username: 1,
              fullName: 1,
              avatar:1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              _id: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              createdAt: 1,
              views:1
            },
          },
        ],
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        videos: 1,
        totalVideos: 1,
        totalViews: 1,
      },
    },
  ]);
  

  return res.status(200).json(new ApiResponse(200,playlistAggregate,"Playlist Fetched Succesfully"))
});

//get User Playlist

const getUserPlaylist=asyncHandler(async(req,res)=>{
    const {userId}=req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid Object Id")
    }

    const user=await User.findById(userId);

    if(!user){
        throw new ApiError(404,"User Not Found")
    }


    const playlistAggregate=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },{
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                }
               
            }
        },{
            $project:{
                _id:1,
                name:1,
                description:1,
                totalVideos:1,
                updatedAt:1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,playlistAggregate,"User Playlist Fetched Succesfully"))
})

export{createPlaylist,deletePlaylist,updatePlaylist,addVideotoPlaylist,deleteVideoFromPlaylist,getPlaylistById,getUserPlaylist}




