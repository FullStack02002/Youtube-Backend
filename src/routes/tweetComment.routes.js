import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addTweetComment, deleteTweetComment, getTweetComments, updateTweetComment } from "../controllers/tweetComment.controller.js";

const router=Router()


router.route("/:tweetId").post(verifyJWT,addTweetComment).get(verifyJWT,getTweetComments);


router.route("/:tweetCommentId").delete(verifyJWT,deleteTweetComment).patch(verifyJWT,updateTweetComment);


export default router;