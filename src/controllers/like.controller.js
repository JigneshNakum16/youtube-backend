import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const videoLike = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  if (videoLike.length <= 0) {
    const like = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (!like) {
      throw new ApiError(500, "Server error while toggling video like");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, like, "toggle video like successfully"));
  } else {
    const alreadyLiked = await Like.findOne({
      video: videoId,
      likedBy: req.user?._id,
    });

    const like = await Like.findByIdAndDelete(alreadyLiked?._id);

    if (!like) {
      throw new ApiError(500, "Server error while toggle removing video like");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          " video like removed successfully"
        )
      );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  const commentLike = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
      },
    },
  ]);

  if (commentLike.length <= 0) {
    const comments = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!comments) {
      throw new ApiError(500, "Server error while toggling comment like");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, comments, "comment like successfully"));
  } else {
    const alreadyLiked = await Like.findOne({
      comment: commentId,
      likedBy: req.user?._id,
    });

    const removeLike = await Like.findByIdAndDelete(alreadyLiked?._id);

    if (!removeLike) {
      throw new ApiError(
        500,
        "Server error while toggling comment like removing"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "comment like removing successfully"
        )
      );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Comment id is required");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const tweetLikes = await Like.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
  ]);

  if (tweetLikes.length <= 0) {
    const tweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (!tweet) {
      throw new ApiError(500, "Server error while creating tweet");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, tweet, "tweet like successfully"));
  } else {
    const alreadyLiked = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    const removeLike = await Like.findByIdAndDelete(alreadyLiked?._id);
    if (!removeLike) {
      throw new ApiError(500, "Server error while tweet like removing");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "tweet like removing successfully"
        )
      );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO : get all liked videos
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  const getAllLikes = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "likedBy",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideos: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);


  if (!getAllLikes) {
    throw new ApiError(500, "Server error while getting all likes videos");
  }

  if (getAllLikes.length > 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          getAllLikes,
          "liked all videos fetched successfully"
        )
      );
  } else {
    res.status(404).json(new ApiResponse(404, {}, "No liked videos found"));
  }
});

export { toggleCommentLike, toggleVideoLike, toggleTweetLike, getLikedVideos };
