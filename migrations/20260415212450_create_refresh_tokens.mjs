
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
	await knex.schema.createTable('refresh_tokens', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.string('token_hash', 255).notNullable().unique();
		table.timestamp('expires_at', { useTz: true }).notNullable();
		table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
	await knex.schema.dropTableIfExists('refresh_tokens');
};
