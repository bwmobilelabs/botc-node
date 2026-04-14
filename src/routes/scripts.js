import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// List scripts WIP
/**
 * Raw SQL = 
 * SELECT name, description, is_official, username AS author
 * FROM scripts
 * LEFT JOIN users ON users.id = scripts.owner_id;
 */
router.get('/', async (req, res) => {
	try {
		const scripts = await db('scripts')
			.select('name', 'description', 'is_official', 'username as author')
			.leftJoin('users', 'users.id', 'scripts.owner_id');
		res.json(scripts);
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: 'Failed to list scripts' });
	}
});

export default router;