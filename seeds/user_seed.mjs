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
    },
    {
      username: 'player1',
      email: 'player1@gmail.com',
      password_hash: hashed,
      display_name: 'Player 1'
    },
    {
      username: 'player2',
      email: 'player2@gmail.com',
      password_hash: hashed,
      display_name: 'Player 2'
    },
    {
      username: 'player3',
      email: 'player3@gmail.com',
      password_hash: hashed,
      display_name: 'Player 3'
    },
    {
      username: 'player4',
      email: 'player4@gmail.com',
      password_hash: hashed,
      display_name: 'Player 4'
    },
    {
      username: 'player5',
      email: 'player5@gmail.com',
      password_hash: hashed,
      display_name: 'Player 5'
    },
    {
      username: 'player6',
      email: 'player6@gmail.com',
      password_hash: hashed,
      display_name: 'Player 6'
    },
    {
      username: 'player7',
      email: 'player7@gmail.com',
      password_hash: hashed,
      display_name: 'Player 7'
    },
    {
      username: 'player8',
      email: 'player8@gmail.com',
      password_hash: hashed,
      display_name: 'Player 8'
    },
    {
      username: 'player9',
      email: 'player9@gmail.com',
      password_hash: hashed,
      display_name: 'Player 9'
    },
    {
      username: 'player10',
      email: 'player10@gmail.com',
      password_hash: hashed,
      display_name: 'Player 10'
    },
    {
      username: 'player11',
      email: 'player11@gmail.com',
      password_hash: hashed,
      display_name: 'Player 11'
    },
    {
      username: 'player12',
      email: 'player12@gmail.com',
      password_hash: hashed,
      display_name: 'Player 12'
    },
    {
      username: 'player13',
      email: 'player13@gmail.com',
      password_hash: hashed,
      display_name: 'Player 13'
    },
    {
      username: 'player14',
      email: 'player14@gmail.com',
      password_hash: hashed,
      display_name: 'Player 14'
    },
    {
      username: 'player15',
      email: 'player15@gmail.com',
      password_hash: hashed,
      display_name: 'Player 15'
    },
    {
      username: 'player16',
      email: 'player16@gmail.com',
      password_hash: hashed,
      display_name: 'Player 16'
    },
  ]);
};
