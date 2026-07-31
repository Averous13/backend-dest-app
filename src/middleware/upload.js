import multer from "multer";
import { CloudinaryStorage} from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const destinationStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "destinations",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        transformation: [
            {width: 1600, crop: "limit"},
            {quality: "auto"},
            {fetch_format: "auto"}
        ],
    },
});

const articleStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "article",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        transformation: [
            {width: 1600, crop: "limit"},
            {quality: "auto"},
            {fetch_format: "auto"}
        ],
    }
})

export const upload = multer({
    storage: destinationStorage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

export const uploadArticle = multer({
    storage: articleStorage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
})