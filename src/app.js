import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({extended:true,limit:"50mb"}))
app.use(express.static("public"))
app.use(cookieParser())

//route import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import tweetRouter from './routes/tweet.route.js'
import tweetCommentRouter from "./routes/tweetComment.routes.js"
import replyRouter from "./routes/reply.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import LikeRouter from "./routes/like.routes.js"
import subscriptionRouter from './routes/subscription.routes.js'


//routes declaration

app.use("/api/v1/users",userRouter);
app.use("/api/v1/video",videoRouter);
app.use("/api/v1/comment",commentRouter);
app.use("/api/v1/tweet",tweetRouter);
app.use("/api/v1/tweetcomment",tweetCommentRouter);
app.use('/api/v1/reply',replyRouter);
app.use('/api/v1/playlist',playlistRouter);
app.use('/api/v1/likes',LikeRouter);
app.use('/api/v1/subscriptions',subscriptionRouter);


export {app};