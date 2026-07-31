import express from 'express';
import passport from 'passport';
import {protect,
        restrictTo
} from '../middleware/auth.js';
import AuthController from '../controllers/AuthController.js';

const route = express.Router()

//public route
route.post("/register/user", AuthController.registerUser);
route.post("/register/mitra", AuthController.registerMitra);
route.post("/login", AuthController.login);
route.get("/verify-email/:token", AuthController.verifyEmail);
route.post("/forgot-password", AuthController.forgotPassword);
route.post("/reset-password/:token", AuthController.resetPassword);


//google route
route.get("/google", passport.authenticate("google", { scope: ["profile", "email"]}));
route.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login"}),
        AuthController.googleCallBack);


//protected route
route.use(protect);

route.get("/me", AuthController.getMe);
// route.patch("/me", AuthController.updateProfile);
route.post("/upgrade-to-mitra", AuthController.upgradeToMitra);

//Admin route
route.use(restrictTo("admin"));

route.get("/admin/mitra/pending", AuthController.getPendingMitra);
route.patch("/admin/mitra/:id/approve", AuthController.approveMitra);
route.patch("/admin/mitra/:id/reject", AuthController.rejectMitra);
// route.patch("/admin/mitra/:id/suspend", AuthController.suspendMitra);

export default route;