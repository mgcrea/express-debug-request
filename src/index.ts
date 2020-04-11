import 'source-map-support/register';

export * from './routes/genericRoutes';
export * from './routes/forwardFetchRoutes';
export * from './routes/uploadRoutes';

import app from './server';
export default app;
