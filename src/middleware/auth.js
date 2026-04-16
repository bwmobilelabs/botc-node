import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
	const header = req.headers.authorization;

	if (!header || !header.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Unauthorized', code: 'ACCESS_TOKEN_MISSING' });
	}

	const token = header.slice('Bearer '.length).trim();
	if (!token) {
		return res.status(401).json({ error: 'Unauthorized', code: 'ACCESS_TOKEN_MISSING' });
	}

	try {
		const payload = verifyAccessToken(token);
		req.user_id = payload.sub;
	} catch (err) {
		return res.status(401).json({ error: 'Unauthorized', code: 'ACCESS_TOKEN_INVALID' });
	}

	next();
};