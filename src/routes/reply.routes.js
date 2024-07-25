import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allRepliesOfComment, createReply, deleteReply, updateReply } from "../controllers/reply.controller.js";

const router=Router();


router.route('/:commentId').post(verifyJWT,createReply)

router.route('/:commentId').get(verifyJWT,allRepliesOfComment)


router.route('/:replyId').delete(verifyJWT,deleteReply).patch(verifyJWT,updateReply)


export default router;