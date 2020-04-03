import * as packageInterface from './index';

describe('package', () => {
  it('should expose a stable interface', () => {
    expect(packageInterface).toBeDefined();
    expect(Object.keys(packageInterface)).toEqual([
      '__esModule',
      'default',
      'faviconRoutes',
      'forwardRoutes',
      'uploadRoutes'
    ]);
  });
});
