import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// Get user data from username
/**
 * SELECT username, email, display_name, create_at
 * FROM users
 * WHERE username = :username
 */
router.get('/:username', async (req, res) => {
	const { username } = req.params;
	try {
		const data = await db('users')
			.select('username', 'email', 'display_name', 'created_at')
			.where('username', username);
		res.json(data);
	} catch (error) {
		console.log(err);
		res.status(500).json({ error: 'Failed to get user data' });
	}
});

export default router;