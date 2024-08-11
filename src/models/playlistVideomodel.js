import mongoose, { Schema } from "mongoose";

const playlistVideoSchema = new Schema(
  {
    playlistId: {
      type: Schema.Types.ObjectId,
      ref: "Playlist",
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

export const PlaylistVideo=mongoose.model("PlaylistVideo",playlistVideoSchema);
