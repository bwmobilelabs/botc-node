/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
    await knex.schema.createTable('characters', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 100).notNullable().unique();
        table.enu('type', ['townsfolk', 'outsider', 'minion', 'demon', 'traveler'], {
            useNative: true,
            enumName: 'character_type'
        }).notNullable();
        table.text('ability').notNullable();
        table.text('flavor_text');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
    await knex.schema.dropTableIfExists('characters');
    await knex.schema.raw('DROP TYPE IF EXISTS character_type');
};
