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
	const { id } = req.params;

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
});

// Update game, storyteller only
router.patch('/:id', authMiddleware, async (req, res) => {
	const user_id = req.user_id;
	const { id } = req.params;
	const { script_id, name, phase, day_number, status } = req.body;

	try {
		const game = await db('games')
			.where({
				'storyteller_id': user_id,
				'id': id
			})
			.first();

		if (!game) {
			return res.status(401).json({ message: 'You are not the storyteller of this game' });
		}
		await db('games')
			.where('id', id)
			.update({
				active_script_id: script_id ?? game.active_script_id,
				name: name ?? game.name,
				status: status ?? game.status,
				phase: phase ?? game.phase,
				day_number: day_number ?? game.day_number,
				updated_at: db.fn.now()
			});

		return res.status(200).json({ message: 'Game updated' });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ error: 'Failed to update game' });
	}
});

router.patch("/:gameID/player/:playerID", authMiddleware, async (req, res) => {
	const user_id = req.user_id;
	const { gameID, playerID } = req.params;
	const { character_id, seat_order, is_alive, has_ghost_vote, vote_used, notes } = req.body;

	try {
		const game = await db('games')
			.where({
				'storyteller_id': user_id,
				'id': gameID
			})
			.first();

		if (!game) {
			return res.status(401).json({ message: 'You are not the storyteller of this game' });
		}

		const player = await db('game_players')
			.where({
				'game_id': gameID,
				'user_id': playerID
			})
			.first();

		if (!player) {
			return res.status(404).json({ message: 'Player not found' });
		}

		await db('game_players')
			.where({
				'game_id': gameID,
				'user_id': playerID
			})
			.update({
				character_id: character_id ?? player.character_id,
				seat_order: seat_order ?? player.seat_order,
				is_alive: is_alive ?? player.is_alive,
				has_ghost_vote: has_ghost_vote ?? player.has_ghost_vote,
				vote_used: vote_used ?? player.vote_used,
				notes: notes ?? player.notes,
				updated_at: db.fn.now()
			});

		return res.status(200).json({ message: 'Player updated' });

	} catch (err) {
		if (err.code === '23505' && err.constraint === 'game_players_game_id_seat_order_unique') {
			return res.status(403).json({ error: 'The seat you tried to assign this player is already occupied' });
		}

		console.log(err);
		return res.status(500).json({ error: 'Failed to update game player' });
	}
});

export default router;
