import { describe, it, expect } from 'vitest';
import { defineBlock, text } from '@verevoir/schema';
import { publishFields, isLive } from '../src/publishing.js';

describe('publishFields', () => {
  it('returns status, publishFrom, and publishTo fields', () => {
    const fields = publishFields();
    expect(fields).toHaveProperty('status');
    expect(fields).toHaveProperty('publishFrom');
    expect(fields).toHaveProperty('publishTo');
  });

  it('can be spread into a block definition', () => {
    const block = defineBlock({
      name: 'test',
      fields: {
        title: text('Title'),
        ...publishFields(),
      },
    });
    // Should validate with defaults
    const result = block.validate({ title: 'Hello' });
    expect(result.title).toBe('Hello');
    expect(result.status).toBe('draft');
  });

  it('accepts all three status values', () => {
    const block = defineBlock({
      name: 'test',
      fields: { title: text('Title'), ...publishFields() },
    });

    for (const status of ['draft', 'published', 'archived']) {
      expect(() => block.validate({ title: 'T', status })).not.toThrow();
    }
  });

  it('rejects invalid status values', () => {
    const block = defineBlock({
      name: 'test',
      fields: { title: text('Title'), ...publishFields() },
    });
    expect(() => block.validate({ title: 'T', status: 'deleted' })).toThrow();
  });

  it('accepts optional publish dates', () => {
    const block = defineBlock({
      name: 'test',
      fields: { title: text('Title'), ...publishFields() },
    });
    const result = block.validate({
      title: 'T',
      status: 'published',
      publishFrom: '2025-01-01T00:00:00Z',
      publishTo: '2025-12-31T23:59:59Z',
    });
    expect(result.publishFrom).toBe('2025-01-01T00:00:00Z');
    expect(result.publishTo).toBe('2025-12-31T23:59:59Z');
  });
});

describe('isLive', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  // --- Status checks ---

  it('returns false for draft status', () => {
    expect(isLive({ status: 'draft' }, now)).toBe(false);
  });

  it('returns false for archived status', () => {
    expect(isLive({ status: 'archived' }, now)).toBe(false);
  });

  it('returns false for missing status', () => {
    expect(isLive({}, now)).toBe(false);
  });

  it('returns true for published with no time window', () => {
    expect(isLive({ status: 'published' }, now)).toBe(true);
  });

  // --- publishFrom (embargo) ---

  it('returns false when publishFrom is in the future (embargoed)', () => {
    expect(
      isLive(
        { status: 'published', publishFrom: '2025-07-01T00:00:00Z' },
        now,
      ),
    ).toBe(false);
  });

  it('returns true when publishFrom is in the past', () => {
    expect(
      isLive(
        { status: 'published', publishFrom: '2025-01-01T00:00:00Z' },
        now,
      ),
    ).toBe(true);
  });

  it('returns true when publishFrom equals now', () => {
    expect(
      isLive(
        { status: 'published', publishFrom: '2025-06-15T12:00:00Z' },
        now,
      ),
    ).toBe(true);
  });

  // --- publishTo (expiry) ---

  it('returns false when publishTo is in the past (expired)', () => {
    expect(
      isLive(
        { status: 'published', publishTo: '2025-01-01T00:00:00Z' },
        now,
      ),
    ).toBe(false);
  });

  it('returns true when publishTo is in the future', () => {
    expect(
      isLive(
        { status: 'published', publishTo: '2025-12-31T23:59:59Z' },
        now,
      ),
    ).toBe(true);
  });

  it('returns true when publishTo equals now', () => {
    expect(
      isLive(
        { status: 'published', publishTo: '2025-06-15T12:00:00Z' },
        now,
      ),
    ).toBe(true);
  });

  // --- Both dates (time window) ---

  it('returns true when now is within the window', () => {
    expect(
      isLive(
        {
          status: 'published',
          publishFrom: '2025-01-01T00:00:00Z',
          publishTo: '2025-12-31T23:59:59Z',
        },
        now,
      ),
    ).toBe(true);
  });

  it('returns false when now is before the window', () => {
    expect(
      isLive(
        {
          status: 'published',
          publishFrom: '2025-07-01T00:00:00Z',
          publishTo: '2025-12-31T23:59:59Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('returns false when now is after the window', () => {
    expect(
      isLive(
        {
          status: 'published',
          publishFrom: '2025-01-01T00:00:00Z',
          publishTo: '2025-03-01T00:00:00Z',
        },
        now,
      ),
    ).toBe(false);
  });

  // --- Status takes precedence ---

  it('returns false for draft even with valid time window', () => {
    expect(
      isLive(
        {
          status: 'draft',
          publishFrom: '2025-01-01T00:00:00Z',
          publishTo: '2025-12-31T23:59:59Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('returns false for archived even with valid time window', () => {
    expect(
      isLive(
        {
          status: 'archived',
          publishFrom: '2025-01-01T00:00:00Z',
          publishTo: '2025-12-31T23:59:59Z',
        },
        now,
      ),
    ).toBe(false);
  });

  // --- Edge cases ---

  it('handles null-ish publishFrom and publishTo', () => {
    expect(
      isLive(
        { status: 'published', publishFrom: undefined, publishTo: undefined },
        now,
      ),
    ).toBe(true);
  });

  it('defaults to current time when now is not provided', () => {
    // Published with no window should always be live
    expect(isLive({ status: 'published' })).toBe(true);
    // Published with far-future embargo should not be live
    expect(
      isLive({ status: 'published', publishFrom: '2099-01-01T00:00:00Z' }),
    ).toBe(false);
  });
});
