import ratelimit from "../config/upstash.js"

const rateLimiterMiddlware = async (req, res, next) => {
    try {
        const ip = req.headers["x-forwarded-for"] || req.ip;

        const { success, limit, remaining, reset } = await ratelimit.rateLimit.limit(ip);

        if (!success) {
            return res.status(429).json({
                message: "Too many request, please try again later",
                limit,
                remaining,
                reset,
            })
        }

        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", reset);

        next();
    } catch (error) {
        console.error("Ratelimiting error:", error);
        next(error);
    }
}

export default rateLimiterMiddlware;