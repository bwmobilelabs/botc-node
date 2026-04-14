
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
      description: 'Clouds roll in over Ravenswood Bluff, engulfing this sleepy town and its superstitious inhabitants in foreboding shadow. Freshly-washed clothes dance eerily on lines strung between cottages. Chimneys cough plumes of smoke into the air. Exotic scents waft through cracks in windows and under doors, as hidden cauldrons lay bubbling. An unusually warm Autumn breeze wraps around vine-covered walls and whispers ominously to those brave enough to walk the cobbled streets.\nAnxious mothers call their children home from play, as thunder begins to clap on the horizon. If you listen more closely, however, noises stranger still can be heard echoing from the neighbouring forest. Under the watchful eye of a looming monastery, silhouetted figures skip from doorway to doorway. Those who can read the signs know there is... Trouble Brewing.',
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

  const orderedRows = tbCharNames.map(name =>
    tbRows.find(row => row.name === name)
  );

  const mappedTB = orderedRows.map(row => ({
    script_id: tb.id,
    character_id: row.id
  }));

  await knex('script_characters').insert(mappedTB);
};
