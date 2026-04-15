import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const signAccessToken = (userId) => {
    return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN });
}

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export const signRefreshToken = (userId) => {
    const refreshToken = jwt.sign({ sub: userId, typ: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
    const decoded = jwt.decode(refreshToken);
    let exp_at
    if (decoded && decoded.exp) {
        exp_at = new Date(decoded.exp * 1000);
    }

    return {
        refreshToken,
        expires_at: exp_at
    }
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export const hashRefreshToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
}