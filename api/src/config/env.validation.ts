import Joi from 'joi';

/**
 * Schema de validação das variáveis de ambiente.
 *
 * Roda no boot: variável obrigatória ausente derruba a aplicação com mensagem
 * clara, em vez de estourar no meio de um request em produção.
 *
 * Segredos (DB_PASSWORD, JWT_*, R2_*) são obrigatórios apenas em produção para
 * não travar o scaffold local antes das credenciais existirem.
 */
const emProducao = process.env.NODE_ENV === 'production';
const obrigatorioEmProd = <T extends Joi.AnySchema>(schema: T) =>
  emProducao ? schema.required() : schema.optional().allow('');

export const envValidationSchema = Joi.object({
  // Aplicação
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  TZ: Joi.string().default('America/Sao_Paulo'),
  API_PREFIX: Joi.string().default('api/v1'),

  // CORS e cookies
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  COOKIE_DOMAIN: Joi.string().allow('').default(''),

  // Banco
  DB_HOST: obrigatorioEmProd(Joi.string()),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: obrigatorioEmProd(Joi.string()),
  DB_PASSWORD: obrigatorioEmProd(Joi.string()),
  DB_NAME: obrigatorioEmProd(Joi.string()),
  DB_MIGRATIONS_RUN: Joi.boolean().default(true),
  DB_POOL_LIMIT: Joi.number().integer().min(1).max(50).default(10),

  // JWT — mínimo de 32 caracteres para não aceitar segredo fraco
  JWT_ACCESS_SECRET: obrigatorioEmProd(Joi.string().min(32)),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: obrigatorioEmProd(Joi.string().min(32)),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // Storage
  STORAGE_DRIVER: Joi.string().valid('r2', 'local').default('r2'),
  R2_ACCOUNT_ID: obrigatorioEmProd(Joi.string()),
  R2_ACCESS_KEY_ID: obrigatorioEmProd(Joi.string()),
  R2_SECRET_ACCESS_KEY: obrigatorioEmProd(Joi.string()),
  R2_BUCKET: Joi.string().default('andorinha-dev'),
  R2_SIGNED_URL_TTL: Joi.number().integer().min(60).default(900),

  // Seed
  ADMIN_NOME: Joi.string().default('Administrador'),
  ADMIN_EMAIL: Joi.string().email().optional().allow(''),
  ADMIN_PASSWORD: Joi.string().min(8).optional().allow(''),

  // Regras de negócio
  RESERVA_VAGA_TTL_MINUTOS: Joi.number().integer().min(1).default(15),
});
