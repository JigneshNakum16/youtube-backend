import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {

  try {
    if (!localFilePath) {
      console.error("No file path provided");
      return null;
    }

    if (!fs.existsSync(localFilePath)) {
      console.error("File does not exist at the provided path:", localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("File uploaded to Cloudinary:", response.url);
    // console.log("Cloudinary upload response:", response);

    // Optionally, delete the local file after successful upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);

    // Remove the locally saved temporary file if the upload operation failed
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkError) {
        console.error("Error deleting the local file:", unlinkError);
      }
    }

    return null;
  }
};

export { uploadOnCloudinary };
