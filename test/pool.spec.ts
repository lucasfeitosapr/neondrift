import { describe, test, expect } from 'vitest';
import { Pool } from '../src/game/pool';

describe('Pool', () => {
  test('creates pool with initial size', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 5);

    expect(pool.size()).toBe(5);
  });

  test('creates pool with zero initial size', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 0);

    expect(pool.size()).toBe(0);
  });

  test('creates pool with very large initial size', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 10000);

    expect(pool.size()).toBe(10000);
  });

  test('borrows item from pool', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 3);

    const item = pool.borrow();

    expect(item).toBeDefined();
    expect(pool.size()).toBe(2);
  });

  test('handles pool exhaustion (borrow when empty)', () => {
    const factory = () => ({ value: Math.random() });
    const pool = new Pool(factory, 0);

    // Should create new item when pool is empty
    const item1 = pool.borrow();
    const item2 = pool.borrow();

    expect(item1).toBeDefined();
    expect(item2).toBeDefined();
    expect(pool.size()).toBe(0);
    // Items should be different instances
    expect(item1).not.toBe(item2);
  });

  test('releases item back to pool', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 0);

    const item = pool.borrow();
    pool.release(item);

    expect(pool.size()).toBe(1);
  });

  test('handles releasing same item multiple times', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 0);

    const item = pool.borrow();
    pool.release(item);
    pool.release(item);
    pool.release(item);

    // Pool should accept multiple releases (though not ideal)
    expect(pool.size()).toBe(3);
  });

  test('borrows released items before creating new ones', () => {
    const factory = () => ({ value: Math.random() });
    const pool = new Pool(factory, 0);

    const item1 = pool.borrow();
    pool.release(item1);
    const item2 = pool.borrow();

    // Should reuse released item
    expect(item2).toBe(item1);
    expect(pool.size()).toBe(0);
  });

  test('handles borrow/release cycle', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 2);

    const item1 = pool.borrow();
    const item2 = pool.borrow();
    expect(pool.size()).toBe(0);

    pool.release(item1);
    expect(pool.size()).toBe(1);

    const item3 = pool.borrow();
    expect(pool.size()).toBe(0);
    expect(item3).toBe(item1); // Should reuse released item
  });

  test('handles multiple borrows and releases', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 3);

    const items: any[] = [];
    for (let i = 0; i < 5; i++) {
      items.push(pool.borrow());
    }

    expect(pool.size()).toBe(0);

    // Release all items
    items.forEach(item => pool.release(item));

    expect(pool.size()).toBe(5);
  });

  test('handles borrow/release race conditions', () => {
    const factory = () => ({ value: Math.random() });
    const pool = new Pool(factory, 10);

    // Simulate rapid borrow/release
    const borrowed: any[] = [];
    for (let i = 0; i < 20; i++) {
      const item = pool.borrow();
      borrowed.push(item);
    }

    // Release all
    borrowed.forEach(item => pool.release(item));

    expect(pool.size()).toBe(20);
  });

  test('creates items with factory function', () => {
    let counter = 0;
    const factory = () => ({ id: counter++, value: 0 });
    const pool = new Pool(factory, 0);

    const item1 = pool.borrow();
    const item2 = pool.borrow();

    expect(item1.id).toBe(0);
    expect(item2.id).toBe(1);
  });

  test('handles pool with complex objects', () => {
    const factory = () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      active: false
    });
    const pool = new Pool(factory, 5);

    const item = pool.borrow();
    expect(item).toBeDefined();
    expect(item.x).toBe(0);
    expect(item.y).toBe(0);
    expect(item.active).toBe(false);
  });

  test('handles empty pool size', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 0);

    expect(pool.size()).toBe(0);
  });

  test('handles pool size after multiple operations', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 3);

    pool.borrow();
    pool.borrow();
    expect(pool.size()).toBe(1);

    const item = pool.borrow();
    pool.release(item);
    expect(pool.size()).toBe(1);
  });

  test('handles borrow when pool has items', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 5);

    const item = pool.borrow();
    expect(item).toBeDefined();
    expect(pool.size()).toBe(4);
  });

  test('handles release when pool is empty', () => {
    const factory = () => ({ value: 0 });
    const pool = new Pool(factory, 0);

    const item = pool.borrow();
    pool.release(item);

    expect(pool.size()).toBe(1);
  });

  test('handles factory that returns null', () => {
    const factory = () => null as any;
    const pool = new Pool(factory, 0);

    const item = pool.borrow();
    expect(item).toBeNull();
  });

  test('handles factory that returns undefined', () => {
    const factory = () => undefined as any;
    const pool = new Pool(factory, 0);

    const item = pool.borrow();
    expect(item).toBeUndefined();
  });
});
