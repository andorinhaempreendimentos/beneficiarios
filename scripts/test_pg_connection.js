const fs = require('fs');
const { Client } = require('./node_modules/pg');

function getDbConfig() {
  const envContent = fs.readFileSync('api/.env', 'utf8');
  const env = {};
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        env[k] = v;
      }
    }
  });

  return {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT || '5432', 10),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };
}

async function test() {
  const config = getDbConfig();
  console.log('Testando conexao direta via PG com:', config.host, config.port, config.database);
  const client = new Client(config);
  await client.connect();
  const res = await client.query('SELECT count(*) FROM beneficiarios WHERE deleted_at IS NULL;');
  console.log('Conexao estabelecida com sucesso! Total de beneficiarios ativos:', res.rows[0].count);
  await client.end();
}

test().catch(err => {
  console.error('Falha de conexao:', err.message);
  process.exit(1);
});
