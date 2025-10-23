export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  version: process.env.VERSION ?? '1.0.0',
});
