
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
	await knex.schema.createTable('games', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('storyteller_id').notNullable().references('id').inTable('users');
		table.uuid('active_script_id').references('id').inTable('scripts');
		table.string('invite_code', 8).notNullable().unique();
		table.enu('status', ['lobby', 'in_progress', 'completed'], {
			useNative: true,
			enumName: 'game_status'
		}).notNullable().defaultTo('lobby');
		table.string('name', 100);
		table.string('phase', 20).defaultTo('day');
		table.integer('day_number').defaultTo(1);
		table.timestamps(true, true);
	});

	await knex.schema.createTable('game_players', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
		table.uuid('user_id').notNullable().references('id').inTable('users');
		table.uuid('character_id').references('id').inTable('characters');
		table.integer('seat_order');
		table.boolean('is_alive').notNullable().defaultTo(true);
		table.boolean('has_ghost_vote').notNullable().defaultTo(true);
		table.boolean('vote_used').notNullable().defaultTo(false);
		table.text('notes');
		table.timestamps(true, true);
		table.unique(['game_id', 'user_id']);
		table.unique(['game_id', 'seat_order']);
	});

	await knex.schema.createTable('reminder_token_definitions', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
		table.string('text', 100).notNullable();
	});

	await knex.schema.createTable('game_reminder_tokens', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
		table.uuid('target_player_id').notNullable().references('id').inTable('game_players').onDelete('CASCADE');
		table.uuid('reminder_def_id').references('id').inTable('reminder_token_definitions');
		table.string('custom_text', 100);
		table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
	await knex.schema.dropTableIfExists('game_reminder_tokens');
	await knex.schema.dropTableIfExists('game_players');
	await knex.schema.dropTableIfExists('reminder_token_definitions');
	await knex.schema.dropTableIfExists('games');
	await knex.raw('DROP TYPE IF EXISTS game_status');
};
