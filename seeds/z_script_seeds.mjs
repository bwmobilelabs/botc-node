
export const seed = async (knex) => {
  // Deletes ALL existing entries
  await knex('script_characters').del();
  await knex('scripts').del();

  // Get admin to own the script
  const admin = await knex('users').select('id').where({ username: 'botc_admin' }).first();

  // Insert TB Script owned by admin
  const [tb] = await knex('scripts')
    .insert({
      owner_id: admin.id,
      name: 'Trouble Brewing',
      description: '...',
      is_official: true
    }).returning('id');

  // Get IDs of all the chars on script
  const tbCharNames = [
    'Washerwoman',
    'Librarian',
    'Investigator',
    'Chef',
    'Empath',
    'Fortune Teller',
    'Undertaker',
    'Monk',
    'Ravenkeeper',
    'Virgin',
    'Slayer',
    'Soldier',
    'Mayor',
    'Butler',
    'Saint',
    'Recluse',
    'Drunk',
    'Poisoner',
    'Spy',
    'Baron',
    'Scarlet Woman',
    'Imp'
  ]

  const tbRows = await knex('characters').select('id', 'name').whereIn('name', tbCharNames);

  const mappedTB = tbRows.map(row => ({
    script_id: tb.id,
    character_id: row.id
  }));

  await knex('script_characters').insert(mappedTB);
};
