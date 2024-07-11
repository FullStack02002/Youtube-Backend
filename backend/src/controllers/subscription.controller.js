import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "unsubscribed succesfully")
      );
  }

  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { subscribed: true }, "subscribed succesfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }

  const subscribers=await Subscription.aggregate([
    {
      $match: {
        channel:new mongoose.Types.ObjectId(channelId)
      }
  },{
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline:[
          {
            $lookup:{
              from:"subscriptions",
              localField:"_id",
              foreignField:"channel",
              as:"subscribedToSubscriber"
            }
          },
          {
            $addFields:{
              subscribedToSubscriber:{
                $cond:{
                  if:{
                    $in:[new mongoose.Types.ObjectId(channelId),"$subscribedToSubscriber.subscriber"]
                  },
                  then:true,
                  else:false
                }
              },
              subscriptionCount:{
                $size:"$subscribedToSubscriber"
              }
            }
          },
          {
            $project:{
              subscribedToSubscriber:1,
              subscriptionCount:1,
              _id:0,
              username:1,
              fullName:1,
              avatar:1,
              _id:0
            }
            
          },
        ]
      }
  },
  {
    $addFields:{
        subscribers:{
            $first:"$subscribers"
        }
    }
  },
    {
      $project: {
        subscribers:1,
        _id:0
      }
    }
  
  ])
  return res.status(200).json(new ApiResponse(200,subscribers,"Subscriber Fetched Succesfully"));
});

const getSubscribedChannels=asyncHandler(async(req,res)=>{
  const {subscriberId}=req.params;
  if(!isValidObjectId(subscriberId)){
    throw new ApiError(400,"Invalid Subscriber Id")
  }
  const subscriber=await User.findById(subscriberId);
  if(!subscriber){
    throw new ApiError(404,"Subscriber Not Found")
  }

  const subscribedChannels=await Subscription.aggregate([{
    $match: {
      subscriber:new mongoose.Types.ObjectId(subscriberId)
    }
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline:[
          {
            $lookup:{
              from:"videos",
              localField:"_id",
              foreignField:"owner",
              as:"videos",
              pipeline:[
                {
                  $project:{
                    _id:1,
                    videoFile:1,
                    thumbnail:1,
                    owner:1,
                    title:1,
                    description:1,
                    createdAt:1,
                    duration:1
                  }
                }
              ]
            }
          },{
            $addFields:{
              LatestVideo:{
                $last:"$videos"
              }
            }
          },{
            $project:{
              _id:1,
              username:1,
              fullName:1,
              avatar:1,
              LatestVideo:1,
              thumbnail:1,
              owner:1,
              title:1,
              description:1,
              duration:1,
              createdAt:1
              
            }
          }
        ]
      }
      },{
      $addFields: {
        subscribedChannel:{
          $first:"$subscribedChannel"
        }
      }
      },{
      $project: {
        subscribedChannel:1,
        _id:0
      }
      }
   
  ])

  return res.status(200).json(new ApiResponse(200,subscribedChannels,"Subscribed Channels Fetched Succesfully"))
})

export { toggleSubscription ,getUserChannelSubscribers,getSubscribedChannels};
