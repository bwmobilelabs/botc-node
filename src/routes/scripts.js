import { Router } from 'express';
import db from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// List all scripts
/**
 * SELECT scripts.id, name, description, is_official, username AS author
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

// List all scripts created by a user
/**
 * SELECT scripts.id, name, description, is_official, username AS author
 * FROM scripts
 * JOIN users ON users.id = scripts.owner_id
 * WHERE owner_id = id (from token)
 */
router.get('/my_scripts', authMiddleware, async (req, res) => {
	const id = req.user_id;
	try {
		const scripts = await db('scripts')
			.select('scripts.id', 'name', 'description', 'is_official', 'username as author')
			.join('users', 'users.id', 'scripts.owner_id')
			.where('owner_id', id);
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

// Insert new script
/**
 * INSERT INTO scripts (owner_id, name, description, is_official)
 * VALUES (user_id, script_title, description, false) # Only seeded scripts are official
 * 
 * SELECT id, name FROM characters
 * WHERE name in (character_1, character_2, etc)
 * 
 * INSERT INTO script_characters (script_id, character_id)
 * VALUES (script_id, character_id)
 */
router.post('/create_script', authMiddleware, async (req, res) => {
	const user_id = req.user_id;
	const { script_title, description, character_names } = req.body;
	try {
		const [script] = await db('scripts')
			.insert({
				owner_id: user_id,
				name: script_title,
				description,
				is_official: false
			})
			.returning('id');

		const rows = await db('characters').select('id', 'name').whereIn('name', character_names);
		const orderedRows = character_names.map((n) => rows.find((row) => row.name === n));
		const scriptCharacters = orderedRows.map((row) => ({
			script_id: script.id,
			character_id: row.id
		}));

		await db('script_characters').insert(scriptCharacters);

		res.json({
			message: 'Script Created',
			script_id: script.id
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: 'Failed to create script.' });
	}
});

export default router;