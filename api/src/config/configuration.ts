/**
 * Configuração tipada da aplicação.
 *
 * Ponto único de leitura de process.env — o resto do código consome via
 * ConfigService<AppConfig>, com autocomplete e sem string solta.
 */
export interface AppConfig {
  app: {
    env: 'development' | 'production' | 'test';
    porta: number;
    prefixo: string;
    producao: boolean;
  };
  cors: {
    frontendUrl: string;
  };
  cookies: {
    dominio: string | undefined;
    seguro: boolean;
  };
  database: {
    host: string;
    porta: number;
    usuario: string;
    senha: string;
    nome: string;
    migrationsRun: boolean;
    poolLimit: number;
  };
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  storage: {
    driver: 'r2' | 'local';
    r2: {
      accountId: string;
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
      signedUrlTtl: number;
    };
  };
  seed: {
    adminNome: string;
    adminEmail: string;
    adminSenha: string;
  };
  negocio: {
    reservaVagaTtlMinutos: number;
  };
}

const bool = (valor: string | undefined, padrao: boolean): boolean =>
  valor === undefined || valor === '' ? padrao : valor === 'true' || valor === '1';

const num = (valor: string | undefined, padrao: number): number => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

export const configuration = (): AppConfig => {
  const env = (process.env.NODE_ENV ?? 'development') as AppConfig['app']['env'];
  const producao = env === 'production';

  return {
    app: {
      env,
      // Em produção a Hostinger injeta PORT. Nunca fixar porta.
      porta: num(process.env.PORT, 3001),
      prefixo: process.env.API_PREFIX ?? 'api/v1',
      producao,
    },
    cors: {
      frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    },
    cookies: {
      // undefined faz o browser usar o host atual — correto em localhost.
      dominio: process.env.COOKIE_DOMAIN || undefined,
      seguro: producao,
    },
    database: {
      host: process.env.DB_HOST ?? '',
      porta: num(process.env.DB_PORT, 3306),
      usuario: process.env.DB_USER ?? '',
      senha: process.env.DB_PASSWORD ?? '',
      nome: process.env.DB_NAME ?? '',
      migrationsRun: bool(process.env.DB_MIGRATIONS_RUN, true),
      poolLimit: num(process.env.DB_POOL_LIMIT, 10),
    },
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    },
    storage: {
      driver: (process.env.STORAGE_DRIVER ?? 'r2') as 'r2' | 'local',
      r2: {
        accountId: process.env.R2_ACCOUNT_ID ?? '',
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        bucket: process.env.R2_BUCKET ?? 'andorinha-dev',
        signedUrlTtl: num(process.env.R2_SIGNED_URL_TTL, 900),
      },
    },
    seed: {
      adminNome: process.env.ADMIN_NOME ?? 'Administrador',
      adminEmail: process.env.ADMIN_EMAIL ?? '',
      adminSenha: process.env.ADMIN_PASSWORD ?? '',
    },
    negocio: {
      reservaVagaTtlMinutos: num(process.env.RESERVA_VAGA_TTL_MINUTOS, 15),
    },
  };
};
