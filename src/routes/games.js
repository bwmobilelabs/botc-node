import { Router } from 'express';
import db from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = Router();

const MAX_INVITE_ATTEMPTS = 15;

// Helper functions
const insertGame = async (knex, { storytellerId, gameName, scriptId, inviteCode }) => {
	const [row] = await knex('games')
		.insert({
			storyteller_id: storytellerId,
			active_script_id: scriptId ?? null,
			invite_code: inviteCode,
			name: gameName,
		})
		.returning('id');
	return { id: row.id, inviteCode };
};

const createGameWithUniqueInvite = async (knex, { storytellerId, gameName, scriptId }) => {
	for (let attempt = 0; attempt < MAX_INVITE_ATTEMPTS; attempt++) {
		const inviteCode = nanoid(6);
		try {
			return await insertGame(knex, { storytellerId, gameName, scriptId, inviteCode });
		} catch (err) {
			if (err.code === '23505') {
				continue;
			}
			throw err;
		}
	}
	const err = new Error('Failed to generate unique invite code');
	err.code = 'INVITE_EXHAUSTED';
	throw err;
};

// Routes

// Create a game (return an invite code)
router.post('/', authMiddleware, async (req, res) => {
	const user_id = req.user_id;
	const { game_name, script_id } = req.body;

	try {
		const { id, inviteCode } = await createGameWithUniqueInvite(db, {
			storytellerId: user_id,
			gameName: game_name,
			scriptId: script_id,
		});

		return res.status(200).json({
			game_id: id,
			invite_code: inviteCode,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({ error: 'Failed to create game' });
	}
});

router.post('/join', authMiddleware, async (req, res) => {
	const user_id = req.user_id;
	const { invite_code } = req.body;

	try {
		const game = await db('games')
			.where('invite_code', invite_code)
			.select('id', 'name')
			.first();

		if (!game) {
			return res.sendStatus(404);
		}

		await db('game_players').insert({
			game_id: game.id,
			user_id: user_id
		});

		return res.status(200).json({ message: `Joined game ${game.name}` });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ error: 'Failed to join game' });
	}
});

router.post('/:id/leave', authMiddleware, async (req, res) => {
	const user_id = req.user_id;
	const { id } = req.params

	try {
		const deleted = await db('game_players')
			.where({ 'game_id': id, 'user_id': user_id })
			.del();

		if (deleted === 0) {
			return res.sendStatus(404);
		}

		return res.status(200).json({ message: 'You have left the game' });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ error: 'Failed to leave game' });
	}
})

export default router;
