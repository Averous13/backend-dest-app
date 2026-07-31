import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        public_id: {
            type: String,
            required:true
        },
    },
    { _id: false}
);

const articleSchema =  new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            maxLength: 60
        },
        content: {
            type: String,
            required: true
        },
        excerpt: {
            type: String,
        },
        hero: {
            type: imageSchema,
        },
        author: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft"
        },
        related: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Destination"
        },
        category: {
            type: String,
            enum: ["populer", "keluarga", "budaya", "event", "kuliner", "petualangan"]
        }  
    },
    { timestamps: true}
);

export default mongoose.model("Articles", articleSchema);