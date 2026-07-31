import mongoose from "mongoose";

const CoordinatesSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: (v) => v.length === 2,
        message: "Coordinates harus berupa [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema({
    address: { type: String, required: true},
    village: { type: String, required: true},
    district: { type: String, required: true},
    coordinates: { type: CoordinatesSchema, required: true},
},  { _id: false})

const ImageSchema = new mongoose.Schema(
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

const PriceSchema = new mongoose.Schema({
    min: {type: Number, required: true, min: 0},
    max: {type: Number, required: true, min: 0},
    currency: { type: String, default: "IDR"}
}, 
{_id: false})

const RoomTypeSchema = new mongoose.Schema({
    name: {type: String, required: true}, 
    price: {type: Number, required: true},
    capacity: {type: Number, required: true},
    quantity: {type: String, required: true},
    bed_type: {
        type: String,
        enum: ["Single", "Twin", "Queen", "King", "Double", "Dorm"],
        default: "Single"
    },
    facilities: { type: [String], required: true}
},{_id: false})

const OtherSchema = new mongoose.Schema({
    label: {type: String, required: true},
    desc: {type: String, required: true}
},{_id: false})

const PoliciesSchema = new mongoose.Schema({
    check_in: {type: String, required: true, default: "13.00"},
    check_out: {type: String, required: true, default: "12.00"},
    cancellation: {type: String, required: true},
    is_smoking: {type: Boolean, required: true, default: false},
    document: {type: String},
    early_check_in: {type: String},
    late_check_out: {type: String},
    is_pet_allowed: {type: Boolean, required: true, default: false},
    other: { type: [OtherSchema]}
},{_id: false})

const AvailabilitySchema = new mongoose.Schema({
    is_available: {type: Boolean, default: true},
    last_updated: {type: Date, default: Date.now},
    unavailable_date: [{type: Date}]
},{_id: false})

const FacilityItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String }, // optional (misal: "wifi", "tv")
}, { _id: false });

const AccomodationsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    }, 
    type: {
        type: String,
        enum: ['Homestay', 'Villa', 'Guest House', 'Hotel']
    },
    location: {
        type: LocationSchema,
        required: true
    },
    price: {
        type: PriceSchema,
        required: true
    },
    roomType: {
        type: [RoomTypeSchema],
        required: true
    },
    facilities: {
        room: [FacilityItemSchema],
        service: [FacilityItemSchema],
        connectivity: [FacilityItemSchema],
        nearby: [FacilityItemSchema],
        eatery: [FacilityItemSchema],
        common: [FacilityItemSchema],
        entertainment: [FacilityItemSchema],
        other: [FacilityItemSchema]
    },
    images: {
        type: [ImageSchema],
        required: true
    },
    policies: {
        type: PoliciesSchema,
        required: true
    },
    availability: {
        type: AvailabilitySchema,
        required: true
    }

})

export default mongoose.model("Accomodations", AccomodationsSchema);