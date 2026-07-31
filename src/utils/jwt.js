/* eslint-disable no-undef */
import jwt from "jsonwebtoken"

export const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d'}
    );
}

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export const decodeToken = (token) => {
    return jwt.decode(token, { complete: true });
}

