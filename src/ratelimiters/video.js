import {rateLimit} from "express-rate-limit"

// Rate limiter for incrementViewCount endpoint
const incrementViewCountLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    max: 5, // Limit each IP to 10 requests per 24 hours
    message: "Too many requests from this IP to increment views, please try again later.",
    keyGenerator: (req) => req.params.videoId, // Rate limit by video ID

  });


  export {incrementViewCountLimiter}