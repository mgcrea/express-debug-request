export const {
  DEBUG = '',
  EXPRESS_SESSION_SECRET = 'bVporhF6CJ4Nct3Gkb7P',
  FETCH_FORWARD_TIMEOUT = `${5 * 1000}`, // 5s
  MULTER_FILE_SIZE_LIMIT = `${10 * Math.pow(1024, 2)}`, // 10 MB
  NODE_ENV = 'development',
  NODE_HOST = '0.0.0.0',
  NODE_PORT = '3000',
  WHITELIST_FORWARD = ''
} = process.env;

export const IS_PRODUCTION = NODE_ENV === 'production';
