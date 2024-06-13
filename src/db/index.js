import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "../constants.js";

const app = express();

const connectionDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    app.on("error", (error) => {
        console.error("error", error);
    });
    
    console.log(
      `MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection Failed :", error);
    process.exit(1);
  }
};

export default connectionDB;
