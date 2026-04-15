import { Router } from 'express';
import db from '../config/db.js';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { hashRefreshToken, signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * SELECT password_hash, id FROM users
 * WHERE username = username
 */
router.post('/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		const rows = await db('users')
			.select('password_hash', 'id')
			.where('username', username);

		const storedHash = rows[0]?.password_hash;
		if (!rows || !storedHash) {
			res.status(401).json({ error: 'Username or password is incorrect' });
			return;
		}
		let match = await bcrypt.compare(password, storedHash);

		if (match) {
			const user_id = rows[0].id
			const accessToken = signAccessToken(user_id);

			const { refreshToken, expires_at } = signRefreshToken(user_id);
			const token_hash = hashRefreshToken(refreshToken);

			await db('refresh_tokens').insert([
				{
					user_id,
					token_hash,
					expires_at
				}
			]);

			res.cookie(
				'refresh',
				refreshToken,
				{
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					path: '/api/auth',
					maxAge: 604800000
				}
			);
			res.json({
				user: {
					id: user_id,
					username
				},
				accessToken
			});
			return;
		} else {
			res.status(401).json({ error: 'Username or password is incorrect' });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: 'Failed to perform auth' });
	}
});

/**
 * INSERT INTO users (username, email, password_hash)
 * VALUES (username, email, hashed)
 */
router.post('/register', async (req, res) => {
	const { username, email, password } = req.body;
	try {
		const hashed = await bcrypt.hash(password, 12);
		const obj = await db('users').insert([
			{
				username,
				email,
				password_hash: hashed
			}
		]).returning('id');
		const user_id = obj[0].id
		const accessToken = signAccessToken(user_id);

		const { refreshToken, expires_at } = signRefreshToken(user_id);
		const token_hash = hashRefreshToken(refreshToken);

		await db('refresh_tokens').insert([
			{
				user_id,
				token_hash,
				expires_at
			}
		]);

		res.cookie(
			'refresh',
			refreshToken,
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/api/auth',
				maxAge: 604800000
			}
		);

		res.json({
			user: {
				id: user_id,
				username
			},
			accessToken
		});
	} catch (err) {
		if (err.code === '23505') {
			// duplicate username or email
			return res.status(409).json({ error: 'Username or email already in use' });
		}
		console.log(err);
		res.status(500).json({ error: 'Failed to perform auth' });
	}
});

// Get user data from username
/**
 * SELECT username, email, display_name, create_at
 * FROM users
 * WHERE id = :id (from token)
 */
router.get('/me', authMiddleware, async (req, res) => {
	const id = req.user_id;
	try {
		const data = await db('users')
			.select('username', 'email', 'display_name', 'created_at')
			.where('id', id).first();
		res.json(data);
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: 'Failed to get user data' });
	}
});

export default router;