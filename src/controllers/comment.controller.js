import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  try {
    const getComment = Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owners",
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: "$likes",
          },
          owner: {
            $first: "$owners",
          },
          isLiked: {
            $cond: {
              if: {
                $in: [req.user?._id, "$likes.likedBy"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          likesCount: 1,
          owner: {
            fullName: 1,
            username: 1,
            avatar: 1,
          },
          isLiked: 1,
        },
      },
    ]);

    if (!getComment) {
      throw new ApiError(500, "Server error while getting comments");
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(getComment, options);

    if (!comments) {
      throw new ApiError(500, "Server error while loading comments section");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully"));
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Server error while processing the request");
  }
});

// const getVideoComment = asyncHandler(async (req, res) => {
//   //TODO: get all comments for a video
//   const { videoId } = req.params;
//   const { page = 1, limit = 10 } = req.query;
//   if (!videoId) {
//     throw new ApiError(400, "videoId is required");
//   }

//   if (!isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid videoId");
//   }

//   const getComment = await Comment.aggregate([
//     {
//       $match: {
//         video: new mongoose.Types.ObjectId(videoId),
//       },
//     },
//     {
//       $lookup: {
//         from: "user",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owners",
//       },
//     },
//     {
//       $lookup: {
//         from: "likes",
//         localField: "_id",
//         foreignField: "comment",
//         as: "likes",
//       },
//     },
//     {
//       $addFields: {
//         likesCount: {
//           $size: "$likes",
//         },
//         owner: {
//           $first: "$owners",
//         },
//         isLiked: {
//           $cond: {
//             if: {
//               $in: [req.user?._id, "$likes.likedBy"],
//             },
//             then: false,
//             else: true,
//           },
//         },
//       },
//     },
//     {
//       $sort: {
//         createdAt: -1,
//       },
//     },
//     {
//       $limit: 10,
//     },
//     {
//       $project: {
//         content: 1,
//         createdAt: 1,
//         likesCount: 1,
//         owner: {
//           fullName: 1,
//           username: 1,
//           avatar: 1,
//         },
//         isLiked: 1,
//       },
//     },
//   ]);

//   console.log("getComment", getComment);
//   if (!getComment) {
//     throw new ApiError(500, "Server error while getting commits");
//   }

//   //   const options = {
//   //     page: parseInt(page, 1),
//   //     limit: parseInt(limit, 10),
//   //   };
//   const options = {
//     page,
//     limit,
//   };

//   const comments = await Comment.aggregatePaginate(getComment, options)
//     .then(function (results) {
//       console.log("results", results);
//     })
//     .catch(function (err) {
//       console.log("error ", err);
//     });

//   console.log("comments : ", comments);

//   if (!comments) {
//     throw new ApiError(500, "Server error while loading commits section");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, comments, "commits fetched successfully"));
// });

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const addComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!addComment) {
    throw new ApiError(500, "Server error while adding comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, addComment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is not found");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Server error while updating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Server error while deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComment, addComment, updateComment, deleteComment };
