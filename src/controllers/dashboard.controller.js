import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {Subscription} from '../models/subscription.model.js'
import {Video} from '../models/video.model.js'
import mongoose from 'mongoose';


const getChannelStats=asyncHandler(async(req,res)=>{
const userId=new mongoose.Types.ObjectId(req.user?._id);

const totalSubscribers=await Subscription.aggregate([
    {
        $match:{
            channel:userId
        }
    },{
        $group:{
            _id:null,
            SubscriptionCount:{
                $sum:1
            }
        }
    }
])

const video=await Video.aggregate([{
    $match: {
      owner:userId
    }
  },{
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "video",
      as: "likes"
    }
  },{
    $project: {
      totalLikes:{
        $size:"$likes"
      },
      totalViews:"$views",
    
    }
  },{
    $group: {
      _id: null,
      totalViews: {
        $sum:"$totalViews"
      },
      totalLikes:{
        $sum:"$totalLikes"
      },
      totalVideos:{
        $sum:1
      }
    }
  }])

  const channelStats={
    totalSubscribers:totalSubscribers[0]?.SubscriptionCount || 0,
    totalLikes:video[0]?.totalLikes || 0,
    totalViews:video[0]?.totalViews || 0,
    totalVideos:video[0]?.totalVideos || 0

  }

  return res.status(200).json(new ApiResponse(200,channelStats,"Channel Stats Fetched Succesfully"))




})

const getChannelVideos=asyncHandler(async(req,res)=>{
    const userId=new mongoose.Types.ObjectId(req.user?._id);

    const videos=await Video.aggregate([{
        $match: {
          owner:userId
        }
      },{
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes"
        }
      },{
        $addFields: {
          LikesCount: {
            $size:"$likes"
            }, 
          createdAt:{
            $dateToParts:{
              date:"$createdAt"
            }
          }
        }
      },{
        $sort: {
          createdAt: -1
        }
      },{
        $project: {
          _id:1,
          title:1,
          videoFile:1,
          thumbnail:1,
          description:1,
          isPublished:1,
          createdAt:1,
          LikesCount:1
        }
      }])


      return res.status(200).json(new ApiResponse(200,videos,"Channel Videos Fetched Succesfully"))


})

export {getChannelStats,getChannelVideos}
