const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listenerId: { type: mongoose.Schema.Types.ObjectId, ref: "Listener", required: true },
    isUserBlocked: { type: Boolean, default: false },
    isListenerBlocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

BlockSchema.index({ userId: 1, listenerId: 1 }, { unique: true });
BlockSchema.index({ userId: 1, listenerId: 1, isUserBlocked: 1, isListenerBlocked: 1 });

module.exports = mongoose.model("Block", BlockSchema);
