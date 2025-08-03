
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomeTable, usersTable } from '../db/schema';
import { type CreateIncomeInput } from '../schema';
import { createIncome } from '../handlers/create_income';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateIncomeInput = {
  description: 'Catering service payment',
  amount: 1500.50,
  category: 'catering',
  source: 'ABC Company',
  date: new Date('2024-01-15T10:00:00Z')
};

describe('createIncome', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an income record', async () => {
    const result = await createIncome(testInput);

    // Basic field validation
    expect(result.description).toEqual('Catering service payment');
    expect(result.amount).toEqual(1500.50);
    expect(typeof result.amount).toBe('number');
    expect(result.category).toEqual('catering');
    expect(result.source).toEqual('ABC Company');
    expect(result.date).toEqual(testInput.date);
    expect(result.recorded_by).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save income to database', async () => {
    const result = await createIncome(testInput);

    // Query using proper drizzle syntax
    const incomeRecords = await db.select()
      .from(incomeTable)
      .where(eq(incomeTable.id, result.id))
      .execute();

    expect(incomeRecords).toHaveLength(1);
    expect(incomeRecords[0].description).toEqual('Catering service payment');
    expect(parseFloat(incomeRecords[0].amount)).toEqual(1500.50);
    expect(incomeRecords[0].category).toEqual('catering');
    expect(incomeRecords[0].source).toEqual('ABC Company');
    expect(incomeRecords[0].date).toEqual(testInput.date);
    expect(incomeRecords[0].recorded_by).toEqual(1);
    expect(incomeRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle income with null source', async () => {
    const inputWithNullSource: CreateIncomeInput = {
      description: 'Cash sales',
      amount: 250.00,
      category: 'sales',
      source: null,
      date: new Date('2024-01-16T14:30:00Z')
    };

    const result = await createIncome(inputWithNullSource);

    expect(result.description).toEqual('Cash sales');
    expect(result.amount).toEqual(250.00);
    expect(result.source).toBeNull();
    expect(result.category).toEqual('sales');
  });

  it('should handle different income categories', async () => {
    const inputs = [
      { ...testInput, category: 'sales', description: 'Daily sales revenue' },
      { ...testInput, category: 'investment', description: 'Equipment lease income' },
      { ...testInput, category: 'other', description: 'Miscellaneous income' }
    ];

    for (const input of inputs) {
      const result = await createIncome(input);
      expect(result.category).toEqual(input.category);
      expect(result.description).toEqual(input.description);
    }
  });
});
