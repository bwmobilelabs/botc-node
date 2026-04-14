import bcrypt from 'bcrypt';

export const seed = async (knex) => {
  // Deletes ALL existing entries
  await knex('users').del();

  const hashed = await bcrypt.hash('password', 12);

  // Inserts seed entries
  await knex('users').insert([
    {
      username: 'botc_admin',
      email: 'bwallace@bwmobilelabs.com',
      password_hash: hashed,
      display_name: 'BOTC Admin'
    }
  ]);
};
