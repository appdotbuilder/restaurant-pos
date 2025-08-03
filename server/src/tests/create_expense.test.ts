
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateExpenseInput = {
  description: 'Office supplies purchase',
  amount: 150.75,
  category: 'Office Equipment',
  vendor: 'OfficeMax',
  receipt_number: 'RCP-2024-001',
  date: new Date('2024-01-15')
};

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an expense with all fields', async () => {
    const result = await createExpense(testInput);

    // Basic field validation
    expect(result.description).toEqual('Office supplies purchase');
    expect(result.amount).toEqual(150.75);
    expect(typeof result.amount).toBe('number');
    expect(result.category).toEqual('Office Equipment');
    expect(result.vendor).toEqual('OfficeMax');
    expect(result.receipt_number).toEqual('RCP-2024-001');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.recorded_by).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an expense with null optional fields', async () => {
    const inputWithNulls: CreateExpenseInput = {
      description: 'Utility payment',
      amount: 200.00,
      category: 'Utilities',
      vendor: null,
      receipt_number: null,
      date: new Date('2024-01-16')
    };

    const result = await createExpense(inputWithNulls);

    expect(result.description).toEqual('Utility payment');
    expect(result.amount).toEqual(200.00);
    expect(result.category).toEqual('Utilities');
    expect(result.vendor).toBeNull();
    expect(result.receipt_number).toBeNull();
    expect(result.date).toEqual(new Date('2024-01-16'));
  });

  it('should save expense to database', async () => {
    const result = await createExpense(testInput);

    // Query database to verify storage
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    const savedExpense = expenses[0];
    expect(savedExpense.description).toEqual('Office supplies purchase');
    expect(parseFloat(savedExpense.amount)).toEqual(150.75);
    expect(savedExpense.category).toEqual('Office Equipment');
    expect(savedExpense.vendor).toEqual('OfficeMax');
    expect(savedExpense.receipt_number).toEqual('RCP-2024-001');
    expect(savedExpense.date).toEqual(new Date('2024-01-15'));
    expect(savedExpense.recorded_by).toEqual(1);
    expect(savedExpense.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CreateExpenseInput = {
      description: 'Small purchase',
      amount: 12.99,
      category: 'Supplies',
      vendor: 'Local Store',
      receipt_number: 'RCP-123',
      date: new Date()
    };

    const result = await createExpense(decimalInput);

    expect(result.amount).toEqual(12.99);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(parseFloat(expenses[0].amount)).toEqual(12.99);
  });
});
