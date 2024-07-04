import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  toggleVideoLike,
  toggleCommentLike,
  toggleReplyLike,
  toggleTweetLike,
  getLikedVideos,
} from "../controllers/like.controller.js";

import { Router } from "express";

const router = Router();


router.route("/toggle/v/:videoId").post(verifyJWT,toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT,toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT,toggleTweetLike);
router.route("/toggle/r/:replyId").post(verifyJWT,toggleReplyLike);
router.route("/videos").get(verifyJWT,getLikedVideos);

export default router;
