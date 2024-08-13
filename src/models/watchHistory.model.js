import mongoose, { Schema } from "mongoose";

const watchHistorySchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  {
    timestamps: true,
  }
);


export const watchHistory=mongoose.model("watchHistory",watchHistorySchema);