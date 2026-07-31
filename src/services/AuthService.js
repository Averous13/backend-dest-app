import User from "../models/User.js";
import appError from "../utils/appError.js";
import { generateToken, verifyToken } from "../utils/jwt.js"
import { generateUserName } from "../utils/generateUserName.js";
import crypto from "crypto";


function formatUserResponse(user) {
  return {
    _id: user._id,
    userName: user.userName,
    email: user.email,

    profile: {
        name: user.profile?.name,
        alamat: user.profile?.alamat,
        phone: user.profile?.phone,
        avatar: user.profile?.avatar,
        pekerjaan: user.profile?.pekerjaan,
    },

    role: user.role,
    isActive: user.isActive,
    is_email_verified: user.isEmailVerified,
    auth_provider: user.googleId ? "google" : "local",
    mitraProfile: user.role === "mitra" ? user.mitraProfile : undefined,
    created_at: user.createdAt,
  };
}

const AuthService = {
    async registerUser(data) {
        const { name, email, password, phone} = data;

        const existing = await User.findOne({email});
        if (existing) throw new appError("Email sudah terdaftar", 409);

        const userName = generateUserName(email);

        const user = await User.create({
            userName,
            email,
            password, 
            profile: {
                name,
                phone,
            },
            auth_provider: "local",
            is_email_verified: false,
            isActive: true,
            status: "active",
            role: "user"
        });

        const verifyToken = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false});

        // TODO:
        // Tambahkan susulan untuk notifikasi verifikasi pada email

        const token = generateToken(user._id, user.role);
        return { user: formatUserResponse(user), token};
    },

    async registerMitra(data) {
        const {
            name, email, password, phone, alamat,
            //Data bisnis wajib
            business_name, ktp_number,npwp_number ,bank_name, bank_account_number, bank_account_holder,
        } = data;

        if (!business_name) throw new appError("Nama usaha wajib diisi", 400);
        if (!ktp_number) throw new appError("Nomor KTP pemilik usaha wajib diisi", 400);
        if (!npwp_number) throw new appError("NPWP Wajib diisi", 400);
        if (!phone) throw new appError("Nomor hp wajib diisi untuk mitra", 400);

        const existing = await User.findOne({ email });

        if (existing) {
            if (existing.role === "user") {
                throw new appError("Email sudah terdaftar sebagai user biasa. Silahkan login dan upgrade akun ke mitra pada profile section", 409);
            }
            throw new appError("Email sudah terdaftar", 409);
        }

        const userName = generateUserName(email);

        const user = await User.create({
            userName,
            email,
            password,
            profile: {
                name,
                phone,
                alamat
            },
            auth_provider: "local",
            is_email_verified: false,
            isActive: true,
            role: "mitra",
            mitraProfile: {
                business_name,
                ktp_number,
                npwp_number,
                bank_name,
                bank_account_number,
                bank_account_holder
            },
        });

        // TODO kirim email konfirmasi ke mitra

        // TODO kirim notifikasi ke admin ada mitra baru
        return {
            message: "Pendaftaran mitra berhasil! Akun Anda sedang dalam proses verifikasi oleh admin. Kami akan menghubungi Anda melalui email dalam 1-3 hari kerja",
            user: formatUserResponse(user),
        };

    },


    async upgradeToMitra(userId, data) {
        const user = await User.findById(userId);
        if (!user) throw new appError("User tidak ditemukan", 404);
        if (user.role === "mitra") throw new appError("Akun sudah terdaftar sebagai mitra", 400);
        if (user.role === "admin") throw new appError("Admin tidak bisa mendaftarkan diri sebagai mitra", 400);

        const {
            business_name, ktp_number,npwp_number ,
            bank_name, bank_account_number, bank_account_holder,
            bio
        } = data;

        if (!business_name) throw new appError("Nama usaha wajib diisi", 400);
        if (!ktp_number) throw new appError("Nomor KTP pemilik usaha wajib diisi", 400);
        if (!npwp_number) throw new appError("NPWP Wajib diisi", 400);

        user.role = "mitra";
        user.isActive = "pending";
        user.mitraProfile = {
            business_name,
            ktp_number,
            bank_name,
            bank_account_number,
            bank_account_holder,
            bio,
        };

        await user.save();

        // TODO: notifikasi admin
        

        return {
            message: "Pengajuan mitra berhasil dikirim! Menunggu verifikasi admin.",
            user: formatUserResponse(user),
        };
    },

    async login(email, password) {
        if (!email || !password) {
            throw new appError("Email dan password wajib diisi", 400);
        }

        const user = await User.findOne({email}).select("+password");
        if (!user) throw new appError("Email atau password salah", 401);

        console.log(user.password);
        if(user.auth_provider === "google" && !user.password) {
            throw new appError("Akun ini terdaftar via Google. Silahkan login menggunakan tombol login dengan Google", 401);
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if(!isPasswordValid) throw new appError("Email atau password salah", 401);

        if(!user.canLogin()) {
            if (user.status === "suspended") {
                throw new appError("Akun anda sedang disuspend. Hubungi admin untuk informasi lebih lanjut", 403);
            }
            if (user.status === "banned") {
                throw new appError("Akun anda telah diblokir permanen", 403);
            }
            if(user.status === "rejected") {
                throw new appError(
                    `Pengajuan mitra anda ditolak. Alasan: ${user.MitraProfile?.rejection_reason} || tidak disebutkan. Silahkan hubungi admin secara langsung`,403
                )
            }
        }

        user.last_login_at = new Date();
        user.login_count += 1;
        await user.save({ validateBeforeSave: false});

        const token = generateToken(user._id, user.role);
        return { user: formatUserResponse(user), token};
    },

    async handleGoogleCallback(googleProfile) {
        const user = await User.findOrCreateFromGoogle(googleProfile);

        if(!user.canLogin()) {
            if(user.status === "suspended") {
                throw new appError("Akun anda sedang disuspend", 403);
            }
            if(user.status === "banned") {
                throw new appError("Akun anda telah diblokir", 403);
            }
        }

        user.last_login_at = new Date();
        user.login_count += 1;
        await user.save({ validateBeforeSave: false});

        const token = generateToken(user._id, user.role);
        return { user: formatUserResponse(user), token};
    },

    async verifyEmail(token) {
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            email_verification_token: hashedToken,
            email_verification_expires: { $gt: Date.now()},
        }).select("+email_verification_token +email_verification_expires");

        if (!user) throw new appError("Token tidak valid atau sudah kadaluarsa", 400);

        user.is_email_verified = true;
        user.email_verification_token = undefined;
        user.email_verification_expires = undefined;
        await user.save({validateBeforeSave: false});

        return { message: "Email berhasil diverifikasi"};
    },

    async forgotPassword(email) {
        const user = await User.findOne({email});

        if (!user) {
            return { message: "Jika email terdaftar, link reset password akan dikirim"};
        }

        if (user.auth_provider === "google" && !user.password) {
            return {
                message: "Akun anda terdaftar via google. Silahkan login menggunakan Google"
            };
        }
    },

    async resetPassword(token, newPassword) {
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            password_reset_expires: { $gt: Date.now()},
            password_reset_token: hashedToken,
        }).select("+password_reset_token +password_reset_expires");4

        if (!user) throw new appError("Token tidak valid atau sudah kadaluarsa");

        user.password = newPassword;
        user.password_reset_token = undefined;
        user.password_reset_expires = undefined;
        await user.save();

        const token_ = generateToken(user.id, user.role);
        return { message: "Password berhasil diubah", token: token_};
    },

    async approveMitra(mitraId, adminId, notes = "" ) {
        const mitra = await User.findById(mitraId);
        if (!mitra) throw new appError("Mitra tidak ditemukan", 404);
        if ( mitra.role !== "mitra") {throw new appError("User ini bukan mitra", 400)};
        if (mitra.status !== "pending") {throw new appError(`Status mitra sudah: ${mitra.status}`, 400)
        
        }

        mitra.status = "active";
        mitra.MitraProfile.verified_at = new Date();
        mitra.MitraProfile.verified_by = adminId;
        mitra.MitraProfile.verification_notes = notes;
        mitra.MitraProfile.rejection_reason = undefined;
        await mitra.save();

        // TODO kirim email approval ke mitra
        return { message: `Mitra ${mitra.name} berhasil di approve`, user: formatUserResponse(mitra)}
    },

    async rejectMitra(mitraId, adminId, reason) {
        if (!reason) throw new appError("Alasan penolakan wajib diisi", 400);

        const mitra = await User.findById(mitraId);
        if (!mitra) throw new appError("Mitra tidak ditemukan", 404);
        if (mitra.role !== "mitra") throw new appError("User ini bukan mitra", 400);

        mitra.status="rejected";
        mitra.MitraProfile.rejection_reason = reason;
        mitra.MitraProfile.verified_by = adminId;
        await mitra.save();

        // TODO kirim email rejection ke mitra
        return { message: `Mitra ${mitra.name} ditolak`, user: formatUserResponse(mitra)}


    },

    async suspendUser(userId, reason) {
        const user = await User.findById(userId);
        if (!user) throw new appError("User tidak ditemukan", 404);
        if (user.role === "admin") throw new appError("Admin tidak bisa disuspend", 400);

        user.status = "suspended";
        await user.save({ validateBeforeSave: false});
        

        return { message: `User ${user.profile.name}`};
    },

    async getMe(userId) {
        const user = await User.findById(userId);
        if (!user) throw new appError("User tidak ditemukan", 404);
        return formatUserResponse(user);
    },

    async verifyUserToken(token) {
        if (!token) throw new appError("Token tidak ditemukan", 401);
        const decoded = verifyToken(token);
        
        if (!decoded) {
        throw new appError("Token tidak valid atau sudah kadaluarsa", 401);
        }
        const user = await User.findById(decoded.id);
        if (!user) throw new appError("User tidak ditemukan", 401);
        if (user.isPasswordChangeAfter(decoded.iat)) {
        throw new appError("Password baru-baru ini diubah. Silakan login kembali", 401);
        }
        if (!user.canLogin()) {
        throw new appError("Akun Anda tidak aktif", 403);
        }
        return user;
    },
}

export default AuthService;