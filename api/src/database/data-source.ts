import { DataSource, DataSourceOptions } from 'typeorm';
import { configuration } from '../config/configuration';

const cfg = configuration();
const db = cfg.database;

/**
 * Opções compartilhadas entre o TypeOrmModule (runtime) e o CLI de migrations.
 * Mantidos num lugar só para não divergir.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: db.host,
  port: db.porta,
  username: db.usuario,
  password: db.senha,
  database: db.nome,

  // Entidades — procura em dist/ porque o CLI compila antes de rodar
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],

  // Nunca sincronizar schema em runtime — só via migrations
  synchronize: false,

  // Roda migrations pendentes no boot. Essencial: a Hostinger não permite
  // executar CLI por SSH no Web App gerenciado.
  migrationsRun: db.migrationsRun,

  // Segurança: transação única por migration (rollback se a migration falhar)
  migrationsTransactionMode: 'all',

  charset: 'utf8mb4_unicode_ci',

  // Pool conservador — plano Business tem limite de conexões MySQL
  extra: {
    connectionLimit: db.poolLimit,
    // Falha em 10s em vez de pendurar o boot indefinidamente
    connectTimeout: 10_000,
  },

  // Log de queries só em dev para não poluir prod
  logging: cfg.app.producao ? ['error', 'migration'] : ['query', 'error', 'migration'],
};

/**
 * DataSource exportado para uso pelo CLI do TypeORM:
 *   npx typeorm migration:generate -d src/database/data-source.ts
 *   npx typeorm migration:run    -d src/database/data-source.ts
 */
export const AppDataSource = new DataSource(dataSourceOptions);
