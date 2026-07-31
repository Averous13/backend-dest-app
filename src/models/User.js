import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import MitraProfileSchema from "./MitraProfile.js";
import { generateUserName } from "../utils/generateUserName.js";

const profileSchema = new mongoose.Schema(
    {
    name: String,
    alamat: String,
    phone: String,
    pekerjaan: String,
    avatar: String,
    }, 
    { _id:false})

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        select: false
    },
    profile: {
        type: profileSchema
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'mitra'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'suspended', 'rejected', 'banned'],
    },
    isActive: {
        type: Boolean,
        default: true
    },
    mitraProfile: {
        type: MitraProfileSchema
    },
    is_email_verified: { 
        type: Boolean,
        default: false 
    },
    email_verification_token: {
        type: String, select: false
    },
    email_verification_expires: {
        type: Date, select: false
    },
    password_reset_token: {
        type: String, select: false,
    },
    password_reset_expires: {
        type: Date, select: false
    },
    last_login_at: {
        type: Date
    },
    last_login_ip: {
        type: String
    },
    login_count: { type: Number, default: 0}
}, {
    timestamps: true
});

// indexing
userSchema.index({role: 1, status: 1});
userSchema.index({status: 1})


// presave hooks
userSchema.pre("save", async function() {
    if (!this.isModified("password") || !this.password) return;

    this.password = await bcrypt.hash(this.password, 12);

    if(!this.isNew) {
        this.password_changed_at = new Date(Date.now() - 1000);
    }

})

// Instance Methods
//validasi password
userSchema.methods.isPasswordCorrect = async function (inputPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(inputPassword, this.password);
}

//validasi perubahan password setelah jwt dibuat
userSchema.methods.isPasswordChangeAfter = function (jwtIssuedAt) {
    if (this.password_changed_at) {
        const changedTimestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);
        return jwtIssuedAt < changedTimestamp
    }

    return false
}


//generate ulang token untuk reset password
userSchema.methods.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.password_reset_token = crypto.createHash("sha26")
        .update(token)
        .digest('hex');
    this.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000);
    return token;
}


//generate token untuk verifikasi email
userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.email_verification_token = crypto  
        .createHash("sha256")
        .update(token)
        .digest('hex');
    this.email_verification_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
  return token;
}

userSchema.methods.isPartnerVerified = function () {
    return this.role === 'mitra' && this.status === "active"
}

userSchema.methods.isAdmin = function () {
    return this.role === 'admin';
}

userSchema.methods.isPartner = function () {
    return this.role === 'mitra';
}

userSchema.methods.canLogin = function () {
    return  ["active", "pending"].includes(this.status);
}

// Static Methods
// Buat akun sendiri atau via google

userSchema.statics.findOrCreateFromGoogle = async function (googleProfile) {
    const { id: googleId, displayName: name, emails, photos} = googleProfile;
    const email = emails[0].value;
    const avatar = photos?.[0]?.value;
    const userName = generateUserName(email);

    let user = await this.findOne({ googleId});

    if (!user) {
        
        user = await this.findOne({ email});
        if (user) {
            user.googleId = googleId;
            user.auth_provider = "google";
            if (!user.avatar) user.avatar = avatar;
            user.is_email_verified = true;
            await user.save()
        } else {
      // Buat akun baru
            user = await this.create({
            userName,
            email,
            profile: {
                name,
                avatar,
            },
            googleId,
            auth_provider: "google",
            role: "user",       // Default user biasa
            status: "active",   // Langsung aktif
            is_email_verified: true, // Email sudah terverifikasi via Google
            });
        }
    }
    return user;
}

userSchema.statics.getPendingMitra = function () {
  return this.find({ role: "mitra", status: "pending_verification" })
    .select("name email phone mitra_profile created_at")
    .sort("-created_at");
};

const User = mongoose.model("User", userSchema);

export default User;

