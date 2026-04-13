
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
	await knex.schema.createTable('scripts', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.string('name', 100).notNullable();
		table.text('description');
		table.boolean('is_official').notNullable().defaultTo(false);
		table.timestamps(true, true);
	});

	await knex.schema.createTable('script_characters', (table) => {
		table.uuid('script_id').notNullable().references('id').inTable('scripts').onDelete('CASCADE');
		table.uuid('character_id').notNullable().references('id').inTable('characters').onDelete('CASCADE');
		table.primary(['script_id', 'character_id']);
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
	await knex.schema.dropTableIfExists('script_characters');
	await knex.schema.dropTableIfExists('scripts');
};
