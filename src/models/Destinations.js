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

const sectionItemSchema = new mongoose.Schema(
    {
        label: { type: String, default: ""},
        detail: { type: String, required: true}
    },
    { _id: false}
)

const sectionSchema = new mongoose.Schema(
    {
        description: {type: String, default: ""},
        items: {type: [sectionItemSchema], default: []}
    },
    { _id: false}
)

const destinationsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: 30
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: imageSchema,
        required: true
    },
    location: {
        long: Number,
        lat: Number
    },
    contacts: [String],
    tags: [String],
    access: {
        type: sectionSchema, default: () => ({description: "", items: []})
    },
    time: {
        type: sectionSchema, default: () => ({description: "", items: []})
    }
 }, {timestamps: true}
);



const Destination = mongoose.model('Destination', destinationsSchema);

export default Destination;