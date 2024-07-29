import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Reply } from "../models/reply.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";

//create Reply
const createReply = asyncHandler(async (req, res) => {
  const {commentId}=req.params;
  const { content } = req.body;

  if ([content, commentId].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  const reply = await Reply.create({
    content,
    comment: commentId,
    repliedBy: req.user?._id,
  });

  if (!reply) {
    throw new ApiError(500, "reply not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, reply, "Replied Succesfully"));
});

//Delete Reply
const deleteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;

  if (!isValidObjectId(replyId)) {
    throw new ApiError(400, "invalid reply id");
  }

  const reply = await Reply.findById(replyId);

  if (!reply) {
    throw new ApiError(404, "reply not found");
  }
  if (reply.repliedBy.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "you are not allowed to delete this reply");
  }

  await Reply.findByIdAndDelete(replyId);

  Like.deleteMany({
    reply: replyId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, replyId, "Reply Deleted Succesfully"));
});

//Update Reply

const updateReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(replyId)) {
    throw new ApiError(400, "invalid reply id");
  }

  const reply = await Reply.findById(replyId);

  if (!reply) {
    throw new ApiError(404, "reply not found");
  }

  if (reply.repliedBy.toString() != req.user?._id.toString()) {
    throw new ApiError(400, "You cannot delete this reply");
  }

  const updatedReply = await Reply.findByIdAndUpdate(
    replyId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if(!updateReply){
    throw new ApiError(500, "Error in Updating Reply")
  }

  return res.status(200).json(new ApiResponse(200,updatedReply,"Reply Updated Succesfully"));


});


const allRepliesOfComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;

    if(!commentId){
        throw new ApiError(400,"Invalid Comment Id");
    }
    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"Comment not Found")
    }

    const  replyAggregate=await Reply.aggregate([
        {
            $match:{
                comment:new mongoose.Types.ObjectId(commentId)
            }
        },{
            $lookup:{
                from:"users",
                localField:"repliedBy",
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
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"reply",
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
                        if:{$in:[req.user._id,"$likes.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $sort:{
                createdAt:1
            }
        },{
            $project:{
                content:1,
                createdAt:1,
                owner:1,
                isLiked:1,
                likesCount:1
            }
        }
    ])


    return res.status(200).json(new ApiResponse(200,replyAggregate,"All Replies Fetched Succesfully"));
})

export { createReply, deleteReply,updateReply,allRepliesOfComment };
