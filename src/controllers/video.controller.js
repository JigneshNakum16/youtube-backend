import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!(title && description)) {
    throw new ApiError(400, "Title and Description are required");
  }

  let videoFileLocalPath;
  let thumbnailLocalPath;

  if (
    req.files &&
    Array.isArray(req.files?.videoFile) &&
    req.files?.videoFile.length > 0
  ) {
    videoFileLocalPath = req.files?.videoFile[0]?.path;
  }

  if (
    req.files &&
    Array.isArray(req.files?.thumbnail) &&
    req.files?.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  try {
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
      throw new ApiError(400, "Failed to upload video file");
    }

    if (!thumbnail) {
      throw new ApiError(400, "Failed to upload thumbnail");
    }

    const publishedVideo = await Video.create({
      videoFile: videoFile?.url,
      thumbnail: thumbnail?.url,
      title,
      description,
      duration: videoFile?.duration,
      owner: req.user?._id,
    });

    if (!publishedVideo) {
      throw new ApiError(500, "Server error failed to publish video");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, publishedVideo, "video published successfully")
      );
  } catch (error) {
    if (videoFileLocalPath && fs.existsSync(videoFileLocalPath)) {
      fs.unlinkSync(videoFileLocalPath);
    }
    if (coverImageLocalPath && fs.existsSync(thumbnailLocalPath)) {
      fs.unlinkSync(thumbnailLocalPath);
    }
    throw new ApiError(500, "Server error failed to publish video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!(videoId && videoId?.trim())) {
    throw new ApiError(400, "VideoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // const getVideo = await Video.aggregate([
  //   {
  //     $match: {
  //       owner: new mongoose.Types.ObjectId(req.user?._id),
  //     },
  //   },
  //   {
  //     $project: {
  //       videoFile: 1,
  //       thumbnail: 1,
  //       title: 1,
  //       description: 1,
  //       duration: 1,
  //       owner: 1,
  //       views: 1,
  //       isPublished: 1,
  //     },
  //   },
  // ]);

  // const getVideo = await Video.findById(videoId);

  const getVideo = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        // comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!getVideo) {
    throw new ApiError(500, "Server error while getting video");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, getVideo, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  if (!description) {
    throw new ApiError(400, "Description is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnailLocalPath fils is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail && !thumbnail.url) {
    throw new ApiError(400, "Failed to  upload thumbnail file");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail?.url,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Server error while updating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Server error while deleting video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video is not found");
  }

  console.log("video", video);

  const toggleStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  if (!toggleStatus) {
    throw new ApiError(500, "Server error while changing status");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, toggleStatus, "changing status successfully"));
});
export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
