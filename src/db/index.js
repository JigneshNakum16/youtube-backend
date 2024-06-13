import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectionDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    console.log(
      `MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection Failed :", error);
    process.exit(1);
  }
};

export default connectionDB;
