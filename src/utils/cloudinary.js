/*
When you upload a file to Cloudinary, the response contains various details about the uploaded resource, 
including the public_id. Here's an example of an upload response:
{
  "public_id": "sample_public_id",
  "version": 1574861160,
  "signature": "abcd1234efgh5678ijkl9101",
  "width": 500,
  "height": 500,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2019-11-27T23:26:00Z",
  "tags": [],
  "bytes": 123456,
  "type": "upload",
  "etag": "abcd1234efgh5678ijkl9101",
  "placeholder": false,
  "url": "http://res.cloudinary.com/your_cloud_name/image/upload/v1574861160/sample_public_id.jpg",
  "secure_url": "https://res.cloudinary.com/your_cloud_name/image/upload/v1574861160/sample_public_id.jpg",
  "access_mode": "public"
}

*/

import {v2 as cloudinary } from "cloudinary"

import fs from "fs"



cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:true
  });


  const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response;

    }
    catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload operation got failed 
        return null;

    }
}

const deleteFromCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
    } catch (error) {
        return error;
        console.log("delete on cloudinary failed", error);
    }
};

export {uploadOnCloudinary,deleteFromCloudinary}