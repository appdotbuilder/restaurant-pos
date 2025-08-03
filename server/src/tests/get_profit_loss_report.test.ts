
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesTransactionsTable, incomeTable, expensesTable } from '../db/schema';
import { type ReportPeriodInput } from '../schema';
import { getProfitLossReport } from '../handlers/get_profit_loss_report';

describe('getProfitLossReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate profit loss report with sales and income', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create completed sales transaction
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN001',
        customer_name: 'John Doe',
        total_amount: '100.00',
        tax_amount: '10.00',
        discount_amount: '5.00',
        final_amount: '105.00',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId,
        completed_at: new Date('2024-01-15T10:00:00Z')
      })
      .execute();

    // Create other income
    await db.insert(incomeTable)
      .values({
        description: 'Rental income',
        amount: '50.00',
        category: 'rent',
        source: 'property',
        date: new Date('2024-01-16T10:00:00Z'),
        recorded_by: userId
      })
      .execute();

    // Create expense
    await db.insert(expensesTable)
      .values({
        description: 'Office supplies',
        amount: '30.00',
        category: 'supplies',
        vendor: 'Office Store',
        receipt_number: 'RCP001',
        date: new Date('2024-01-17T10:00:00Z'),
        recorded_by: userId
      })
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getProfitLossReport(input);

    // Verify calculations
    expect(result.total_revenue).toEqual(155); // 105 (sales) + 50 (other income)
    expect(result.total_expenses).toEqual(30);
    expect(result.gross_profit).toEqual(75); // 105 (sales) - 30 (expenses)
    expect(result.net_profit).toEqual(125); // 155 (total revenue) - 30 (expenses)
    expect(result.profit_margin).toEqual(80.65); // (125/155) * 100, rounded to 2 decimal places
    expect(result.period).toEqual('2024-01-01 to 2024-01-31');
  });

  it('should handle empty period with no transactions', async () => {
    const input: ReportPeriodInput = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getProfitLossReport(input);

    expect(result.total_revenue).toEqual(0);
    expect(result.total_expenses).toEqual(0);
    expect(result.gross_profit).toEqual(0);
    expect(result.net_profit).toEqual(0);
    expect(result.profit_margin).toEqual(0);
    expect(result.period).toEqual('2024-02-01 to 2024-02-28');
  });

  it('should only include completed sales transactions', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create pending transaction (should be excluded)
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN001',
        customer_name: 'John Doe',
        total_amount: '100.00',
        tax_amount: '10.00',
        discount_amount: '0.00',
        final_amount: '110.00',
        payment_method: 'cash',
        status: 'pending',
        cashier_id: userId
      })
      .execute();

    // Create completed transaction (should be included)
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN002',
        customer_name: 'Jane Doe',
        total_amount: '50.00',
        tax_amount: '5.00',
        discount_amount: '0.00',
        final_amount: '55.00',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId,
        completed_at: new Date('2024-01-15T10:00:00Z')
      })
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getProfitLossReport(input);

    // Only completed transaction should be included
    expect(result.total_revenue).toEqual(55);
    expect(result.gross_profit).toEqual(55);
    expect(result.net_profit).toEqual(55);
  });

  it('should filter by date range correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Transaction within range
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN001',
        customer_name: 'John Doe',
        total_amount: '100.00',
        tax_amount: '10.00',
        discount_amount: '0.00',
        final_amount: '110.00',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId,
        completed_at: new Date('2024-01-15T10:00:00Z')
      })
      .execute();

    // Transaction outside range
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN002',
        customer_name: 'Jane Doe',
        total_amount: '50.00',
        tax_amount: '5.00',
        discount_amount: '0.00',
        final_amount: '55.00',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId,
        completed_at: new Date('2024-02-15T10:00:00Z')
      })
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getProfitLossReport(input);

    // Only transaction within date range should be included
    expect(result.total_revenue).toEqual(110);
    expect(result.gross_profit).toEqual(110);
    expect(result.net_profit).toEqual(110);
  });

  it('should calculate correct profit margin with mixed revenue and expenses', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Sales revenue
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN001',
        customer_name: 'John Doe',
        total_amount: '200.00',
        tax_amount: '20.00',
        discount_amount: '10.00',
        final_amount: '210.00',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId,
        completed_at: new Date('2024-01-15T10:00:00Z')
      })
      .execute();

    // Other income
    await db.insert(incomeTable)
      .values({
        description: 'Interest income',
        amount: '40.00',
        category: 'interest',
        source: 'bank',
        date: new Date('2024-01-16T10:00:00Z'),
        recorded_by: userId
      })
      .execute();

    // Expenses
    await db.insert(expensesTable)
      .values({
        description: 'Utilities',
        amount: '100.00',
        category: 'utilities',
        vendor: 'Electric Company',
        receipt_number: 'UTIL001',
        date: new Date('2024-01-17T10:00:00Z'),
        recorded_by: userId
      })
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getProfitLossReport(input);

    expect(result.total_revenue).toEqual(250); // 210 + 40
    expect(result.total_expenses).toEqual(100);
    expect(result.gross_profit).toEqual(110); // 210 - 100
    expect(result.net_profit).toEqual(150); // 250 - 100
    expect(result.profit_margin).toEqual(60); // (150/250) * 100
  });
});
