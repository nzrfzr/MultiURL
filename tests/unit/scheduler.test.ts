import { describe, it, expect } from 'vitest';
import {
  calculateAvailableSlots,
  calculateRefillCount,
  validateInterval,
  validateLimit,
} from '../../src/core/scheduler';

describe('scheduler math & invariants', () => {
  it('calculates available slots correctly', () => {
    // Limit 10, 0 active -> 10 slots
    expect(calculateAvailableSlots(10, 0)).toBe(10);
    // Limit 10, 4 active -> 6 slots
    expect(calculateAvailableSlots(10, 4)).toBe(6);
    // Limit 10, 10 active -> 0 slots
    expect(calculateAvailableSlots(10, 10)).toBe(0);
    // Limit lowered to 5 while 8 active -> 0 slots (never negative)
    expect(calculateAvailableSlots(5, 8)).toBe(0);
  });

  it('calculates refill counts capped by queue remaining', () => {
    // 6 available slots, 10 waiting -> refill 6
    expect(calculateRefillCount(10, 4, 10)).toBe(6);
    // 6 available slots, 2 waiting -> refill 2
    expect(calculateRefillCount(10, 4, 2)).toBe(2);
    // 0 available slots, 10 waiting -> refill 0
    expect(calculateRefillCount(10, 10, 10)).toBe(0);
  });

  it('validates limits and intervals', () => {
    expect(validateLimit(0).isValid).toBe(false);
    expect(validateLimit(10).isValid).toBe(true);
    expect(validateLimit(10.8).value).toBe(10); // rounded down to int

    expect(validateInterval(-1).isValid).toBe(false);
    expect(validateInterval(3).isValid).toBe(true);
  });
});
