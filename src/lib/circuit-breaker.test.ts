import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  withCircuitBreaker,
  getCircuitState,
  resetCircuit,
  clearExpiredCircuits,
  CircuitBreakerOpenError,
} from '@/lib/circuit-breaker';

describe('circuit-breaker', () => {
  beforeEach(() => {
    resetCircuit('test');
    resetCircuit('other');
    vi.restoreAllMocks();
  });

  it('starts in closed state', () => {
    expect(getCircuitState('fresh-circuit')).toBe('closed');
  });

  it('executes operation when closed', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await withCircuitBreaker('test', operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledOnce();
  });

  it('opens after reaching failure threshold', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', operation)).rejects.toThrow('fail');
    }
    expect(getCircuitState('test')).toBe('open');
  });

  it('throws CircuitBreakerOpenError when open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', operation)).rejects.toThrow();
    }
    await expect(withCircuitBreaker('test', vi.fn())).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('does not call operation when open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', operation)).rejects.toThrow();
    }
    const probe = vi.fn().mockResolvedValue('should not reach');
    await expect(withCircuitBreaker('test', probe)).rejects.toThrow(CircuitBreakerOpenError);
    expect(probe).not.toHaveBeenCalled();
  });

  it('respects custom failureThreshold', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await expect(withCircuitBreaker('test', operation, { failureThreshold: 3 })).rejects.toThrow();
    }
    expect(getCircuitState('test')).toBe('open');
  });

  it('resets failure count on success', async () => {
    const failOp = vi.fn().mockRejectedValue(new Error('fail'));
    const successOp = vi.fn().mockResolvedValue('ok');

    await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();
    await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();
    await withCircuitBreaker('test', successOp);
    await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();
    await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();
    await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();

    expect(getCircuitState('test')).toBe('closed');
  });

  it('tracks circuits independently', async () => {
    const failOp = vi.fn().mockRejectedValue(new Error('fail'));
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();
    }
    expect(getCircuitState('test')).toBe('open');
    expect(getCircuitState('other')).toBe('closed');

    const successOp = vi.fn().mockResolvedValue('ok');
    const result = await withCircuitBreaker('other', successOp);
    expect(result).toBe('ok');
  });

  it('resetCircuit returns to closed state', async () => {
    const failOp = vi.fn().mockRejectedValue(new Error('fail'));
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', failOp)).rejects.toThrow();
    }
    expect(getCircuitState('test')).toBe('open');
    resetCircuit('test');
    expect(getCircuitState('test')).toBe('closed');
  });

  it('clearExpiredCircuits does not throw', () => {
    expect(() => clearExpiredCircuits()).not.toThrow();
  });

  it('CircuitBreakerOpenError has correct properties', () => {
    const error = new CircuitBreakerOpenError('my-circuit', 5000);
    expect(error.circuitName).toBe('my-circuit');
    expect(error.retryAfterMs).toBe(5000);
    expect(error.name).toBe('CircuitBreakerOpenError');
    expect(error.message).toContain('my-circuit');
  });
});
