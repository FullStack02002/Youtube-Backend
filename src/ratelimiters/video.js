import {rateLimit} from "express-rate-limit"

// Rate limiter for incrementViewCount endpoint
const incrementViewCountLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    max: 5, // Limit each IP to 10 requests per 24 hours
    message: "Too many requests from this IP to increment views, please try again later.",
    keyGenerator: (req) => req.params.videoId, // Rate limit by video ID

  });


  // Rate limiter for add Video to Watch History

  const addVideoToWatchHistoryLimiter=rateLimit({
    windowMs:24*60*60*1000,
    max:1,
    message:"Too many requests from this IP to add video to watch history, please try again later.",
    keyGenerator:(req)=>req.params.videoId
  })


  export {incrementViewCountLimiter,addVideoToWatchHistoryLimiter}