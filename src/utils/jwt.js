import jwt from 'jsonwebtoken';

export const signAccessToken = (userId) => {
    return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN });
}

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}