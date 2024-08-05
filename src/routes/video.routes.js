import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  toggleCommentSection,
  updateVideo,
} from "../controllers/video.controller.js";

import { Router } from "express";

const router = Router();

router.route("/").get(getAllVideos)
.post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

router
  .route("/v/:videoId")
  .get(verifyJWT, getVideoById)
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT,upload.single("thumbnail"),updateVideo)


  router.route("/toggle/publish/:videoId").patch(verifyJWT,togglePublishStatus);
  router.route("/toggle/comment/:videoId").patch(verifyJWT,toggleCommentSection);
  

export default router;
