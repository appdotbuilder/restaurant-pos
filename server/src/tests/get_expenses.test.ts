
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable } from '../db/schema';
import { getExpenses } from '../handlers/get_expenses';

describe('getExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpenses();
    expect(result).toEqual([]);
  });

  it('should return all expenses ordered by created_at desc', async () => {
    // Create a user first (required for recorded_by foreign key)
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    // Insert first expense
    await db.insert(expensesTable)
      .values({
        description: 'Office supplies',
        amount: '150.75',
        category: 'Office',
        vendor: 'Office Depot',
        receipt_number: 'R123',
        date: new Date('2024-01-01'),
        recorded_by: user.id
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second expense
    await db.insert(expensesTable)
      .values({
        description: 'Equipment maintenance',
        amount: '300.00',
        category: 'Maintenance',
        vendor: 'Tech Services',
        receipt_number: null,
        date: new Date('2024-01-02'),
        recorded_by: user.id
      })
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(2);

    // Should be ordered by created_at desc (most recent first)
    expect(result[0].description).toEqual('Equipment maintenance');
    expect(result[0].amount).toEqual(300.00);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].category).toEqual('Maintenance');
    expect(result[0].vendor).toEqual('Tech Services');
    expect(result[0].receipt_number).toBeNull();
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].recorded_by).toEqual(user.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].description).toEqual('Office supplies');
    expect(result[1].amount).toEqual(150.75);
    expect(typeof result[1].amount).toBe('number');
    expect(result[1].category).toEqual('Office');
    expect(result[1].vendor).toEqual('Office Depot');
    expect(result[1].receipt_number).toEqual('R123');
  });

  it('should handle expenses with null optional fields', async () => {
    // Create a user first
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    await db.insert(expensesTable)
      .values({
        description: 'Minimal expense',
        amount: '50.00',
        category: 'Miscellaneous',
        vendor: null,
        receipt_number: null,
        date: new Date(),
        recorded_by: user.id
      })
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Minimal expense');
    expect(result[0].amount).toEqual(50.00);
    expect(result[0].vendor).toBeNull();
    expect(result[0].receipt_number).toBeNull();
  });
});
