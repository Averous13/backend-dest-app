import appError from "./appError.js";
import dotenv from "dotenv";


export const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
}

export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    //Mongoose duplicate key
    if(err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        err = new appError(`Nilai ${field} sudah digunakan`, 400);
    }

    // Mongoose validation error
    if(err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        err = new appError(messages.join(". "), 400)
    }

    if (err.name === "CastError") {
        err = new appError(`ID tidak valid: ${err.value}`, 400);
    }

    res.status(err.statusCode).json({
        status: err.status || "error",
        message: err.message || "Terjadi kesalahan server",
        ...(process.env.NODE_ENV === "development" && {stack: err.stack})
    })
}
