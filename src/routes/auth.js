import { Router } from 'express';
import db from '../config/db.js';
import bcrypt from 'bcrypt';
import { signAccessToken } from '../utils/jwt.js';

const router = Router();

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
			res.json({
				user: {
					id: user_id,
					username
				},
				accessToken
			})
			return;
		} else {
			res.status(401).json({ error: 'Username or password is incorrect' });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: 'Failed to perform auth' });
	}
});

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
		res.json({
			user: {
				id: user_id,
				username
			},
			accessToken
		})
	} catch (err) {
		if (err.code === '23505') {
			// duplicate username or email
			return res.status(409).json({ error: 'Username or email already in use' });
		}
		console.log(err);
		res.status(500).json({ error: 'Failed to perform auth' });
	}
});

export default router;