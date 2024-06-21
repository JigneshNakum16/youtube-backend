import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { SubScription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const isSubscriber = await SubScription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
        subscriber: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
  ]);


  if (!isSubscriber || !isSubscriber.length) {
    const newSubscriber = await SubScription.create({
      channel: channelId,
      subscriber: req.user?._id,
    });


    if (!newSubscriber) {
      throw new ApiError(500, "Server error while newSubscriber Subscribed");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newSubscriber,
          "newSubscriber subscribed successfully"
        )
      );
  } else {
    const unSubscribe = await SubScription.findByIdAndDelete(
      isSubscriber[0]?._id
    );


    if (!unSubscribe) {
      throw new ApiError(500, "Server error while Unsubscribe");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Unsubscribe successfully"
        )
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;


  if (!subscriberId) {
    throw new ApiError(400, "subscriberId is required");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subscriberList = await SubScription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [subscriberId, "$subscribedToSubscriber.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          subscribedToSubscriber: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);


  if (!subscriberList) {
    throw new ApiError(500, "Server error while fetching subscriber list");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriberList,
        "subscriber list fetching successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const channelList = await SubScription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscriberChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          {
            $addFields: {
              latestVideo: {
                $last: "$videos",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriberChannel",
    },
    {
      $project: {
        _id: 0,
        subscribedChannel: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          latestVideo: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            owner: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1,
          },
        },
      },
    },
  ]);


  if (!channelList) {
    throw new ApiError(500, "Server error while fetching channel list");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelList, "channel list fetching successfully")
    );
});

export { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers };
