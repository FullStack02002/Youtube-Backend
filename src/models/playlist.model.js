import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
