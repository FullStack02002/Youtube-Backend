import { Router } from "express";
import { createTweet, deleteTweet, getUsersTweet, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();


router.route("/").post(verifyJWT,createTweet)

router.route("/user/:userId").get(verifyJWT,getUsersTweet)

router.route("/:tweetId").delete(verifyJWT,deleteTweet).patch(verifyJWT,updateTweet)

export default router