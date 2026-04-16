async function insertScriptWithCharacters(knex, { ownerId, name, description, charNames, isOfficial = true }) {
  const [script] = await knex('scripts')
    .insert({
      owner_id: ownerId,
      name,
      description,
      is_official: isOfficial
    })
    .returning('id');

  const rows = await knex('characters').select('id', 'name').whereIn('name', charNames);
  const orderedRows = charNames.map((n) => rows.find((row) => row.name === n));
  const scriptCharacters = orderedRows.map((row, index) => ({
    script_id: script.id,
    character_id: row.id,
    sort_order: index
  }));

  await knex('script_characters').insert(scriptCharacters);
}

export const seed = async (knex) => {
  await knex('script_characters').del();
  await knex('scripts').del();

  const admin = await knex('users').select('id').where({ username: 'botc_admin' }).first();

  await insertScriptWithCharacters(knex, {
    ownerId: admin.id,
    name: 'Trouble Brewing',
    description:
      'Clouds roll in over Ravenswood Bluff, engulfing this sleepy town and its superstitious inhabitants in foreboding shadow. Freshly-washed clothes dance eerily on lines strung between cottages. Chimneys cough plumes of smoke into the air. Exotic scents waft through cracks in windows and under doors, as hidden cauldrons lay bubbling. An unusually warm Autumn breeze wraps around vine-covered walls and whispers ominously to those brave enough to walk the cobbled streets.\nAnxious mothers call their children home from play, as thunder begins to clap on the horizon. If you listen more closely, however, noises stranger still can be heard echoing from the neighbouring forest. Under the watchful eye of a looming monastery, silhouetted figures skip from doorway to doorway. Those who can read the signs know there is... Trouble Brewing.',
    charNames: [
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
  });

  await insertScriptWithCharacters(knex, {
    ownerId: admin.id,
    name: 'Bad Moon Rising',
    description:
      'The sun is swallowed by a jagged horizon as another winter\'s day surrenders to the night. Flecks of orange and red decay into deeper browns, the forest transforming in silent anticipation of the coming snow.\nRavenous wolves howl from the bowels of a rocky crevasse beyond the town borders, sending birds scattering from their cozy rooks. Travellers hurry into the inn, seeking shelter from the gathering chill. They warm themselves with hot tea, sweet strains of music and hearty ale, unaware that strange and nefarious eyes stalk them from the ruins of this once great city.\nTonight, even the livestock know there is a... Bad Moon Rising.',
    charNames: [
      'Grandmother',
      'Sailor',
      'Chambermaid',
      'Exorcist',
      'Innkeeper',
      'Gambler',
      'Gossip',
      'Courtier',
      'Professor',
      'Minstrel',
      'Tea Lady',
      'Pacifist',
      'Fool',
      'Goon',
      'Lunatic',
      'Tinker',
      'Moonchild',
      'Godfather',
      'Devil\'s Advocate',
      'Assassin',
      'Mastermind',
      'Zombuul',
      'Pukka',
      'Shabaloth',
      'Po'
    ]
  });

  await insertScriptWithCharacters(knex, {
    ownerId: admin.id,
    name: 'Sects & Violets',
    description:
      'Vibrant spring gives way to a warm and inviting summer. Flowers of every description blossom as far as the eye can see, tenderly nurtured in public gardens and window boxes overlooking the lavish promenade. Birds sing, artists paint, and philosophers ponder life\'s greatest mysteries inside a bustling tavern as a circus pitches its endearingly ragged tent on the edge of town.\nAs the townsfolk bask in frivolity and mischief, indulging themselves in fine entertainment and even finer wine, dark and clandestine forces are assembling. Witches and cults lurk in majestic ruins on the fringes of the community, hosting secret meetings in underground caves and malevolently plotting the downfall of Ravenswood Bluff and its revelers.\nThe time is ripe for... Sects & Violets.',
    charNames: [
      'Clockmaker',
      'Dreamer',
      'Snake Charmer',
      'Mathematician',
      'Flowergirl',
      'Town Crier',
      'Oracle',
      'Savant',
      'Seamstress',
      'Philosopher',
      'Artist',
      'Juggler',
      'Sage',
      'Mutant',
      'Sweetheart',
      'Barber',
      'Klutz',
      'Evil Twin',
      'Witch',
      'Cerenovus',
      'Pit-Hag',
      'Fang Gu',
      'Vigormortis',
      'No Dashii',
      'Vortox'
    ]
  });
};
