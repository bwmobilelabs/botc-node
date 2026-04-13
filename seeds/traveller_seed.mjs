
export const seed = async (knex) => {
  // Deletes ALL existing entries
  await knex('characters').where('type', 'traveller').del();

  // Inserts seed entries
  await knex('characters').insert([
    {
      name: 'Scapegoat',
      type: 'traveller',
      ability: 'If a player of your alignment is executed, you might be executed instead.',
      flavor_text: 'Good evening! Thank you for inviting me to the ball. I\'m not from around here, but you sure seem like a friendly bunch, by golly. I\'m sure we\'ll get along just dandy. What\'s all that rope for?'
    }
  ]);
};
