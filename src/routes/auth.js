import { Router } from 'express';
import db from '../config/db.js';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		const rows = await db('users')
			.select('password_hash')
			.where('username', username);

		const storedHash = rows[0]?.password_hash;
		if (!rows || !storedHash) {
			res.status(401).json({ error: 'Username or password is incorrect' });
			return;
		}
		let match = await bcrypt.compare(password, storedHash);

		if (match) {
			// Deal with auth token later, just checking hashing now.
			res.json({
				logged_in: true
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

export default router;