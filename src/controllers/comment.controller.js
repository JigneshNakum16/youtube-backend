import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComment = asyncHandler(async (req, res) => {
     //TODO: get all comments for a video
     const {videoId} = req.params
     const {page = 1, limit = 10} = req.query
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
});

const updateComment = asyncHandler(async (req, res) => {
       // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
       // TODO: delete a comment
});

export { getVideoComment, addComment, updateComment, deleteComment };
