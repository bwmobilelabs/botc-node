import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// List all scripts
/**
 * SELECT name, description, is_official, username AS author
 * FROM scripts
 * JOIN users ON users.id = scripts.owner_id
 * LIMIT 20
 */
router.get('/', async (req, res) => {
	try {
		const scripts = await db('scripts')
			.select('scripts.id', 'name', 'description', 'is_official', 'username as author')
			.join('users', 'users.id', 'scripts.owner_id')
			.limit(20);
		res.json(scripts);
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: 'Failed to list scripts' });
	}
});

// Get specific script details
/**
 * SELECT s.name, s.is_official, u.username AS author, c.name AS character_name, c.type, c.ability
 * FROM scripts s
 * JOIN users u ON u.id = s.owner_id
 * JOIN script_characters sc ON sc.script_id = s.id
 * JOIN characters c ON c.id = sc.character_id
 * WHERE s.id = :id
 */
router.get('/:id', async (req, res) => {
	const { id } = req.params
	try {
		// Get all rows
		const rows = await db('scripts as s')
			.select(
				's.name',
				's.description',
				's.is_official',
				'u.username as author',
				'c.name as character_name',
				'c.type',
				'c.ability',
			)
			.join('users as u', 'u.id', 's.owner_id')
			.join('script_characters as sc', 'sc.script_id', 's.id')
			.join('characters as c', 'c.id', 'sc.character_id')
			.where('s.id', id);
		// Shape response
		const script = rows.reduce((acc, row) => {
			if (!acc) {
				acc = {
					name: row.name,
					description: row.description,
					is_official: row.is_official,
					author: row.author,
					characters: []
				}
			}

			acc.characters.push({
				name: row.character_name,
				type: row.type,
				ability: row.ability
			})

			return acc;
		}, null);
		res.json(script);
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: 'Failed to list scripts' });
	}
});

export default router;