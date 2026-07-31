import AuthService from "../services/AuthService.js";
import { catchAsync } from "../utils/catchAsync.js";
import User from "../models/User.js";

class AuthController {
    registerUser = catchAsync(async (req, res) => {
        const result = await AuthService.registerUser(req.body);
        res.status(201).json({status: "success", ...result});
    });

    registerMitra = catchAsync(async (req, res) => {
        const result = await AuthService.registerMitra(req.body);
        res.status(201).json({status: "success", ...result});
    })

    upgradeToMitra = catchAsync(async (req, res) => {
        const result = await AuthService.upgradeToMitra(req.user._id, req.body);
        res.status(201).json({status: "success", ...result});
    })

    login = catchAsync(async (req, res) => {
        const {email, password} = req.body;
        const result = await AuthService.login(email, password);
        res.status(200).json({status: "success", ...result});
    })

    googleCallBack = catchAsync( async (req, res) => {
        const result = await AuthService.handleGoogleCallback(req.user);
        res.redirect(`${process.env.CLIENT_URL}/`);
    })

    verifyEmail = catchAsync( async (req, res) => {
        const result = await AuthService.verifyEmail(req.params.token);
        res.status(200).json({status: "success", ...result});
    })

    forgotPassword = catchAsync( async (req, res) => {
        const result = await AuthService.forgotPassword(req.body.email);
        res.status(200).json({status: "success", ...result});
    })

    resetPassword = catchAsync( async (req, res) => {
        const result = await AuthService.resetPassword(req.params.token, req.body.password);
        res.status(200).json({status: "success", ...result});
    })

    getMe = catchAsync( async (req, res) => {
        const user = await AuthService.getMe(req.user._id);
        res.status(200).json({status: "success", data: user});
    })

    getPendingMitra = catchAsync( async (req, res) => {
        const mitras = await User.getPendingMitra();
        res.status(200).json({status: "success", data: mitras});
    })

    approveMitra = catchAsync ( async (req, res) => {
        const result = await AuthService.approveMitra(
            req.params.id,
            req.user._id,
            req.body.notes
        );

        res.status(200).json({status: "success", ...result});
    })

    rejectMitra = catchAsync (async (req, res) => {
        const result = await AuthService.rejectMitra(
            req.params.id,
            req.user._id,
            req.body.notes
        );

        res.status(201).json({status: "success", ...result});
    })

    suspendUser = catchAsync( async (req, res) => {
        const result = await AuthService.suspendUser(req.params.id, req.body.reason);
        res.status(201).json({status: "success", ...result});
    })



}

export default new AuthController();
