import knex from 'knex';

const config = {
	client: 'pg',
	connection: {
		host: process.env.PGHOST,
		port: Number(process.env.PGPORT) || 5432,
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD || undefined,
		database: process.env.PGDATABASE,
	},
	pool: {
		min: 0,
		max: 10,
	},
	migrations: {
		directory: './migrations',
		extension: 'mjs',
		loadExtensions: ['.mjs'],
	},
	seeds: {
		directory: './seeds',
		extension: 'mjs',
		loadExtensions: ['.mjs'],
	},
};

const db = knex(config);

export const closeDb = async () => {
	await db.destroy();
	console.log('Knex connection pool closed.');
};

export default db;