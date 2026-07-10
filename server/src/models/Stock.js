const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

stockSchema.index(
  {
    product: 1,
    store: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Stock", stockSchema);

