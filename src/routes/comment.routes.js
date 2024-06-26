import { verifyJWT } from "../middlewares/auth.middleware.js";

import { createComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

import { Router } from "express";

const router = Router();


router.route("/:videoId").post(verifyJWT,createComment).get(verifyJWT,getVideoComments);



router.route("/c/:commentId").delete(verifyJWT,deleteComment).patch(verifyJWT,updateComment);



export default router