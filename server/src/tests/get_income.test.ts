
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomeTable, usersTable } from '../db/schema';
import { type CreateIncomeInput } from '../schema';
import { getIncome } from '../handlers/get_income';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  role: 'admin' as const
};

const testIncomeInputs: CreateIncomeInput[] = [
  {
    description: 'Sales Revenue',
    amount: 1500.75,
    category: 'Sales',
    source: 'Food Sales',
    date: new Date('2024-01-15')
  },
  {
    description: 'Service Income',
    amount: 250.00,
    category: 'Services',
    source: 'Catering',
    date: new Date('2024-01-16')
  },
  {
    description: 'Other Income',
    amount: 100.50,
    category: 'Miscellaneous',
    source: null,
    date: new Date('2024-01-17')
  }
];

describe('getIncome', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no income records exist', async () => {
    const result = await getIncome();
    expect(result).toEqual([]);
  });

  it('should fetch all income records', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test income records one by one to ensure different created_at timestamps
    await db.insert(incomeTable)
      .values({
        ...testIncomeInputs[0],
        amount: testIncomeInputs[0].amount.toString(),
        recorded_by: userId
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(incomeTable)
      .values({
        ...testIncomeInputs[1],
        amount: testIncomeInputs[1].amount.toString(),
        recorded_by: userId
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(incomeTable)
      .values({
        ...testIncomeInputs[2],
        amount: testIncomeInputs[2].amount.toString(),
        recorded_by: userId
      })
      .execute();

    const result = await getIncome();

    expect(result).toHaveLength(3);
    
    // Check that results are ordered by created_at desc (newest first)
    // The last inserted record should be first
    expect(result[0].description).toEqual('Other Income');
    expect(result[1].description).toEqual('Service Income');
    expect(result[2].description).toEqual('Sales Revenue');
  });

  it('should return income records with correct data types', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a test income record
    await db.insert(incomeTable)
      .values({
        ...testIncomeInputs[0],
        amount: testIncomeInputs[0].amount.toString(),
        recorded_by: userId
      })
      .execute();

    const result = await getIncome();

    expect(result).toHaveLength(1);
    const income = result[0];

    // Verify field types and values
    expect(income.id).toBeDefined();
    expect(typeof income.id).toBe('number');
    expect(income.description).toEqual('Sales Revenue');
    expect(income.amount).toEqual(1500.75);
    expect(typeof income.amount).toBe('number'); // Critical: should be number, not string
    expect(income.category).toEqual('Sales');
    expect(income.source).toEqual('Food Sales');
    expect(income.date).toBeInstanceOf(Date);
    expect(income.recorded_by).toEqual(userId);
    expect(income.created_at).toBeInstanceOf(Date);
  });

  it('should handle null source values correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create income record with null source
    await db.insert(incomeTable)
      .values({
        ...testIncomeInputs[2], // This one has null source
        amount: testIncomeInputs[2].amount.toString(),
        recorded_by: userId
      })
      .execute();

    const result = await getIncome();

    expect(result).toHaveLength(1);
    expect(result[0].source).toBeNull();
    expect(result[0].description).toEqual('Other Income');
    expect(result[0].amount).toEqual(100.50);
  });

  it('should save and retrieve income records from database correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Insert income record
    await db.insert(incomeTable)
      .values({
        description: 'Test Income',
        amount: '999.99', // Insert as string
        category: 'Test Category',
        source: 'Test Source',
        date: new Date('2024-01-20'),
        recorded_by: userId
      })
      .execute();

    // Retrieve using handler
    const result = await getIncome();

    // Verify data was saved and retrieved correctly
    expect(result).toHaveLength(1);
    const income = result[0];
    expect(income.description).toEqual('Test Income');
    expect(income.amount).toEqual(999.99); // Should be converted back to number
    expect(income.category).toEqual('Test Category');
    expect(income.source).toEqual('Test Source');
    expect(income.date).toBeInstanceOf(Date);
    expect(income.recorded_by).toEqual(userId);
  });
});
