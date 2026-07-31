import cloudinary from "../config/cloudinary.js";

export const rollbackImage = async (publicId) => {
    if (!publicId) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
        });
    } catch (error) {
        console.error("Cloudinary destroy failed:", error);
    }
}

