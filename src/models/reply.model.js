import mongoose,{Schema} from "mongoose";



const replySchema=new Schema({
    content:{
        type:String,
        required:[true,"content is required"]
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    repliedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },


},{
    timestamps:true
})



export const Reply=mongoose.model("Reply",replySchema)