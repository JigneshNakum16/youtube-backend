import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.models.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  if (!description) {
    throw new ApiError(400, "Playlist description is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Server error while Playlist creating");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(500, "Server error while getting user playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "User playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playList = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
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
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.viewCount",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          ownerDetails: {
            username: 1,
            avatar: 1,
          },
        },
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  if (!playList) {
    throw new ApiError(500, "Server error while getting play list");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  // TODO: add video from playlist
  const { playlistId, videoId } = req.params;
  if (!(playlistId && videoId)) {
    throw new ApiError(400, "playlistId and videoId is required");
  }

  if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) {
    throw new ApiError(400, "Invalid playlistId and videoId");
  }

  // const addVideoLocalPath = req.file?.path

  const playList = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playList) {
    throw new ApiError(400, "Playlist not found");
  }

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const addedList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  if (!addedList) {
    throw new ApiError(400, "Server error while adding video in playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addedList, "added video to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;
  if (!(playlistId && videoId)) {
    throw new ApiError(400, "playlistId and videoId is required");
  }

  if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) {
    throw new ApiError(400, "Invalid playlistId and videoId");
  }

  const playList = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playList) {
    throw new ApiError(400, "Playlist not found");
  }

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const removedList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!removedList) {
    throw new ApiError(400, "Server error while removing video in playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, removedList, "removed video to playlist"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  // TODO: update playlist
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const { name, description } = req.body;
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  if (!description) {
    throw new ApiError(400, "Playlist description is required");
  }

  const updateList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
        owner: req.user?._id,
      },
    },
    {
      new: true,
    }
  );

  if (!updateList) {
    throw new ApiError(500, "Server error while updating playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updateList, "Playlist deleted successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const deletedList = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedList) {
    throw new ApiError(500, "Server error while deleting playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

export {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};
