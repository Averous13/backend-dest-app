import mongoose from "mongoose"

const MitraProfileSchema = new mongoose.Schema({
    //data identitas
    business_name: { type: String, trim: true, required: true},
    bio: { type: String, trim: true, maxLength: [500, "Bio Maksimal 500 karakter"]},
    bussiness_type: {type: [String], trim: true, required: true},
    //data verifikasi
    ktp_number: { type: String, trim: true, select: false, required: true}, 
    npwp_number: { type: String, select: false},

    //data pembayaran
    bank_name: {
        type: String, 
        trim: true, 
        enum: ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'Permata', 'Danamon', 'Prima', 'CIMB Niaga']
    },
    bank_account_number: { type: String, trim: true, select: false},
    bank_account_holder: { type: String, trim: true},

    //data verifikasi
    verified_at: {type: Date},
    verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    verification_notes: { type: String, trim: true},
    rejection_reason: { type: String, trim: true},

    //data bisnis
    total_properties: { type: Number, default: 0},
    total_booking_received: { type: Number, default: 0},
    total_revenue: {
        type: Number,
        default: 0,
        select: false
    },
    joined_as_mitra_at: { type: Date, default: Date.now},
}, {_id: false})

export default MitraProfileSchema;