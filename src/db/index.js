import mongoose from "mongoose";
import {DB_NAME} from '../constants.js'


const connectDB = async () => {
    try {
        // const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        const connectionInstance = await mongoose.connect("mongodb+srv://gajrathore353:Gaj123@cluster0.mnul9xm.mongodb.net/youtube")
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        
        process.exit(1)
    }
}

export default connectDB