import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import{
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideotoPlaylist,
    deleteVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylist
} from '../controllers/playlist.controller.js'


const router=Router();

router.route("/").post(verifyJWT,createPlaylist);

router
    .route("/:playlistId")
    .get(verifyJWT,getPlaylistById)
    .patch(verifyJWT,updatePlaylist)
    .delete(verifyJWT,deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(verifyJWT,addVideotoPlaylist);
router.route("/remove/:videoId/:playlistId").patch(verifyJWT,deleteVideoFromPlaylist);

router.route("/user/:userId").get(verifyJWT,getUserPlaylist);


export default router