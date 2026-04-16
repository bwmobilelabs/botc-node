
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
	await knex.schema.alterTable('script_characters', (table) => {
		table.integer('sort_order').nullable();
	});
	await knex.raw(`
		UPDATE script_characters AS sc
		SET sort_order = sub.rn
		FROM (
			SELECT script_id, character_id,
				(ROW_NUMBER() OVER (PARTITION BY script_id ORDER BY character_id) - 1)::integer AS rn
			FROM script_characters
		) AS sub
		WHERE sc.script_id = sub.script_id AND sc.character_id = sub.character_id
	`);
	await knex.raw(
		'ALTER TABLE script_characters ALTER COLUMN sort_order SET NOT NULL'
	);
	await knex.schema.alterTable('script_characters', (table) => {
		table.unique(['script_id', 'sort_order']);
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
	await knex.schema.alterTable('script_characters', (table) => {
		table.dropUnique(['script_id', 'sort_order']);
	});
	await knex.schema.alterTable('script_characters', (table) => {
		table.dropColumn('sort_order');
	});
};
