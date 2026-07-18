import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('exposes createScoped method', () => {
    expect(typeof logger.createScoped).toBe('function');
  });

  it('calls console.error for error level', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error', { code: 'TEST_001' });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('ERROR');
    expect(spy.mock.calls[0][0]).toContain('test error');
    expect(spy.mock.calls[0][0]).toContain('code=TEST_001');
  });

  it('calls console.warn for warn level', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warning');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('WARN');
  });

  it('calls console.info for info level', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test info');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('INFO');
  });

  it('includes ISO timestamp', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test');
    const line = spy.mock.calls[0][0];
    expect(line).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('formats context as key=value pairs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('fail', { url: '/api/test', status: '500' });
    const line = spy.mock.calls[0][0];
    expect(line).toContain('url=/api/test');
    expect(line).toContain('status=500');
  });

  it('handles null context values', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test', { value: null });
    const line = spy.mock.calls[0][0];
    expect(line).toContain('value=null');
  });

  it('includes scope prefix in dev mode', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('scoped test');
    const line = spy.mock.calls[0][0];
    expect(line).toContain('[app]');
  });

  it('createScoped returns a logger with nested scope', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const authLogger = logger.createScoped('auth');
    authLogger.info('login attempt');
    const line = spy.mock.calls[0][0];
    expect(line).toContain('[app:auth]');
    expect(line).toContain('login attempt');
  });

  it('createScoped merges base context with call context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const authLogger = logger.createScoped('auth', { module: 'credentials' });
    authLogger.error('login failed', { username: 'testuser' });
    const line = spy.mock.calls[0][0];
    expect(line).toContain('[app:auth]');
    expect(line).toContain('module=credentials');
    expect(line).toContain('username=testuser');
  });

  it('createScoped supports nested chaining', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const apiLogger = logger.createScoped('api');
    const userLogger = apiLogger.createScoped('user');
    userLogger.warn('rate limited');
    const line = spy.mock.calls[0][0];
    expect(line).toContain('[app:api:user]');
  });

  it('withRequestId includes requestId in every log entry', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reqLogger = logger.withRequestId('req-abc-123');
    reqLogger.error('something failed');
    const line = spy.mock.calls[0][0];
    expect(line).toContain('requestId=req-abc-123');
    expect(line).toContain('something failed');
  });

  it('withRequestId preserves scope', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const scopedLogger = logger.createScoped('auth');
    const reqLogger = scopedLogger.withRequestId('req-xyz-789');
    reqLogger.info('login attempt');
    const line = spy.mock.calls[0][0];
    expect(line).toContain('[app:auth]');
    expect(line).toContain('requestId=req-xyz-789');
  });

  it('withRequestId merges with call context', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const reqLogger = logger.withRequestId('req-def-456');
    reqLogger.warn('rate limited', { endpoint: '/api/login' });
    const line = spy.mock.calls[0][0];
    expect(line).toContain('requestId=req-def-456');
    expect(line).toContain('endpoint=/api/login');
  });

  it('withRequestId supports further createScoped chaining', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reqLogger = logger.withRequestId('req-chain-001');
    const dbLogger = reqLogger.createScoped('db');
    dbLogger.error('query failed', { table: 'users' });
    const line = spy.mock.calls[0][0];
    expect(line).toContain('[app:db]');
    expect(line).toContain('requestId=req-chain-001');
    expect(line).toContain('table=users');
  });
});
