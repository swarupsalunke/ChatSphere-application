const mongoose = require("mongoose");

const statusSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        media: {
            type: String,
            required: true,
        },
        caption: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "Status",
    statusSchema
);