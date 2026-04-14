import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// List scripts WIP
/**
 * Raw SQL = 
 * SELECT name, description, is_official FROM scripts;
 */
router.get('/', async (req, res) => {
	try {
		const scripts = await db('scripts').select('name', 'description', 'is_official');
		res.json(scripts);
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: 'Failed to list scripts' });
	}
});

export default router;