export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  version: process.env.VERSION,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'secret',
    expires_in: parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URI,
  },
});
