
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesTransactionsTable } from '../db/schema';
import { getSalesTransactions } from '../handlers/get_sales_transactions';

describe('getSalesTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getSalesTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all sales transactions', async () => {
    // Create a test user first (required for cashier_id foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test transactions
    await db.insert(salesTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          customer_name: 'John Doe',
          total_amount: '25.50',
          tax_amount: '2.30',
          discount_amount: '0.00',
          final_amount: '27.80',
          payment_method: 'cash',
          status: 'completed',
          cashier_id: userId
        },
        {
          transaction_number: 'TXN002',
          customer_name: null,
          total_amount: '15.75',
          tax_amount: '1.42',
          discount_amount: '2.00',
          final_amount: '15.17',
          payment_method: 'card',
          status: 'pending',
          cashier_id: userId
        }
      ])
      .execute();

    const result = await getSalesTransactions();

    expect(result).toHaveLength(2);
    
    // Check first transaction
    expect(result[0].transaction_number).toEqual('TXN001');
    expect(result[0].customer_name).toEqual('John Doe');
    expect(result[0].total_amount).toEqual(25.50);
    expect(result[0].tax_amount).toEqual(2.30);
    expect(result[0].discount_amount).toEqual(0.00);
    expect(result[0].final_amount).toEqual(27.80);
    expect(result[0].payment_method).toEqual('cash');
    expect(result[0].status).toEqual('completed');
    expect(result[0].cashier_id).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second transaction
    expect(result[1].transaction_number).toEqual('TXN002');
    expect(result[1].customer_name).toBeNull();
    expect(result[1].total_amount).toEqual(15.75);
    expect(result[1].tax_amount).toEqual(1.42);
    expect(result[1].discount_amount).toEqual(2.00);
    expect(result[1].final_amount).toEqual(15.17);
    expect(result[1].payment_method).toEqual('card');
    expect(result[1].status).toEqual('pending');
    expect(result[1].cashier_id).toEqual(userId);
  });

  it('should handle numeric field conversions correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create transaction with specific numeric values
    await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN003',
        customer_name: 'Test Customer',
        total_amount: '99.99',
        tax_amount: '9.00',
        discount_amount: '5.50',
        final_amount: '103.49',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId
      })
      .execute();

    const result = await getSalesTransactions();

    expect(result).toHaveLength(1);
    
    // Verify all numeric fields are converted to numbers
    expect(typeof result[0].total_amount).toBe('number');
    expect(typeof result[0].tax_amount).toBe('number');
    expect(typeof result[0].discount_amount).toBe('number');
    expect(typeof result[0].final_amount).toBe('number');
    
    expect(result[0].total_amount).toEqual(99.99);
    expect(result[0].tax_amount).toEqual(9.00);
    expect(result[0].discount_amount).toEqual(5.50);
    expect(result[0].final_amount).toEqual(103.49);
  });

  it('should preserve transaction order by creation time', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create transactions in sequence
    const firstTransaction = await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN001',
        customer_name: 'First Customer',
        total_amount: '10.00',
        tax_amount: '0.90',
        discount_amount: '0.00',
        final_amount: '10.90',
        payment_method: 'cash',
        status: 'completed',
        cashier_id: userId
      })
      .returning()
      .execute();

    const secondTransaction = await db.insert(salesTransactionsTable)
      .values({
        transaction_number: 'TXN002',
        customer_name: 'Second Customer',
        total_amount: '20.00',
        tax_amount: '1.80',
        discount_amount: '0.00',
        final_amount: '21.80',
        payment_method: 'card',
        status: 'completed',
        cashier_id: userId
      })
      .returning()
      .execute();

    const result = await getSalesTransactions();

    expect(result).toHaveLength(2);
    
    // Verify transactions are returned in creation order
    expect(result[0].id).toEqual(firstTransaction[0].id);
    expect(result[1].id).toEqual(secondTransaction[0].id);
    expect(result[0].transaction_number).toEqual('TXN001');
    expect(result[1].transaction_number).toEqual('TXN002');
  });
});
