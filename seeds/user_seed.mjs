
export const seed = async (knex) => {
  // Deletes ALL existing entries
  await knex('users').del();

  // Inserts seed entries
  await knex('users').insert([
    {
      username: 'botc_admin',
      email: 'bwallace@bwmobilelabs.com',
      password_hash: 'FIXMELATER',
      display_name: 'BOTC Admin'
    }
  ]);
};
