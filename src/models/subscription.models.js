import mongoose, { Schema } from "mongoose";

const subScriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing
      ref: "user",
    },
    channel: {
      type: Schema.Types.ObjectId,  // one to whom  'subscriber' is subscribing
      ref: "channel",
    },
  },
  { timestamps: true }
);

export const SubScription = mongoose.model("SubScription", subScriptionSchema);
