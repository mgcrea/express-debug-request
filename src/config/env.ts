export const {
  DEBUG = '',
  NODE_HOST = '0.0.0.0',
  NODE_PORT = '3000',
  NODE_ENV = 'development',
  MULTER_FILE_SIZE_LIMIT = `${10 * Math.pow(1024, 2)}`, // 10 MB
  FETCH_FORWARD_TIMEOUT = `${5 * 1000}`, // 5s
  WHITELIST_FORWARD = ''
} = process.env;
