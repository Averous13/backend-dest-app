import AuthService from "../services/AuthService.js";
import appError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

//untuk autorisasi akun
export const protect = catchAsync(async(req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    const user = await AuthService.verifyUserToken(token);
    req.user = user;
    next();
})

//pembatasan pada role tertentu
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new appError(
                "Akses anda ditolak", 403
            )); 
        }
        next();
    }
}

//untuk proses verifikasi mitra
export const requireVerifiedMitra = (req, res, next) => {
    if (req.user.role !== "mitra") {
        return next(new appError(
            "Anda tidak memiliki akses pada halaman ini", 403
        ));
    }

    if (req.user.status !== "active") {
        return next(new appError(
            "Akun mitra anda belum terverifikasi atau sedang dalam proses review", 403
        ));
    }
}
//untuk publik access
export const optionalAuth = async(req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (token) {
            const user = await AuthService.verifyUserToken(token);
            req.user = user;
        }
    // eslint-disable-next-line no-empty
    } catch {

    }
    next()
}




// export const authMiddleware = async (req, res, next) => {
//     try {
//         const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

//         if (!token) {
//             return res.status(401).json({ message: "Authorization Denied"});
//         }

//         const decoded = verifyToken(token);

//         if (!decoded) {
//             return res.status(401).json({ message: "Token Invalid"});
//         }

//         const user = await User.findById(decoded.id).select('-__v');

//         if (!user) {
//             return res.status(401).json({ message: "User Not Found!!!"});
//         }

//         req.user = user;
//         next();


//     // eslint-disable-next-line no-unused-vars
//     } catch (error) {
//         console.error('Error authentication:', error);
//         return res.status(500).json({ message: "Internal Server ERROR"
//         })
//     }

// }

// export const requireAdmin = async (req, res, next) => {
//     if (!req.user) {
//         return res.status(401).json({success: false, message: 'Authorization Denied!'});
//     }

//     if(req.user.role !== 'admin') {
//         return res.status(403).json({success: false, message: 'Access Denied'});
//     }

//     next();
// }