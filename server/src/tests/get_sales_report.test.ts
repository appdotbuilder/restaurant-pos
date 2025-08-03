
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, menuCategoriesTable, menuItemsTable, salesTransactionsTable, salesTransactionItemsTable } from '../db/schema';
import { type ReportPeriodInput } from '../schema';
import { getSalesReport } from '../handlers/get_sales_report';

describe('getSalesReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate empty sales report for period with no transactions', async () => {
    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSalesReport(input);

    expect(result.period).toEqual('2024-01-01 to 2024-01-31');
    expect(result.total_sales).toEqual(0);
    expect(result.total_transactions).toEqual(0);
    expect(result.average_transaction).toEqual(0);
    expect(result.top_selling_items).toHaveLength(0);
  });

  it('should generate comprehensive sales report with transactions', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier1@test.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test category
    const categories = await db.insert(menuCategoriesTable)
      .values({
        name: 'Main Course',
        description: 'Main dishes'
      })
      .returning()
      .execute();
    const categoryId = categories[0].id;

    // Create test menu items
    const menuItems = await db.insert(menuItemsTable)
      .values([
        {
          name: 'Burger',
          description: 'Beef burger',
          price: '15.99',
          category_id: categoryId,
          preparation_time: 15
        },
        {
          name: 'Pizza',
          description: 'Margherita pizza',
          price: '22.50',
          category_id: categoryId,
          preparation_time: 20
        }
      ])
      .returning()
      .execute();

    const burgerId = menuItems[0].id;
    const pizzaId = menuItems[1].id;

    // Create test transactions
    const transactions = await db.insert(salesTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          customer_name: 'John Doe',
          total_amount: '31.98',
          tax_amount: '3.20',
          discount_amount: '0.00',
          final_amount: '35.18',
          payment_method: 'cash',
          status: 'completed',
          cashier_id: userId,
          completed_at: new Date('2024-01-15T12:00:00Z')
        },
        {
          transaction_number: 'TXN002',
          customer_name: 'Jane Smith',
          total_amount: '22.50',
          tax_amount: '2.25',
          discount_amount: '0.00',
          final_amount: '24.75',
          payment_method: 'card',
          status: 'completed',
          cashier_id: userId,
          completed_at: new Date('2024-01-16T14:30:00Z')
        }
      ])
      .returning()
      .execute();

    // Create transaction items
    await db.insert(salesTransactionItemsTable)
      .values([
        {
          transaction_id: transactions[0].id,
          menu_item_id: burgerId,
          quantity: 2,
          unit_price: '15.99',
          total_price: '31.98'
        },
        {
          transaction_id: transactions[1].id,
          menu_item_id: pizzaId,
          quantity: 1,
          unit_price: '22.50',
          total_price: '22.50'
        }
      ])
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSalesReport(input);

    expect(result.period).toEqual('2024-01-01 to 2024-01-31');
    expect(result.total_sales).toEqual(59.93); // 35.18 + 24.75
    expect(result.total_transactions).toEqual(2);
    expect(result.average_transaction).toEqual(29.97); // Rounded to 2 decimal places
    expect(result.top_selling_items).toHaveLength(2);
    
    // Check top selling items - Burger should be first (quantity 2)
    expect(result.top_selling_items[0].item_name).toEqual('Burger');
    expect(result.top_selling_items[0].quantity_sold).toEqual(2);
    expect(result.top_selling_items[0].revenue).toEqual(31.98);
    
    expect(result.top_selling_items[1].item_name).toEqual('Pizza');
    expect(result.top_selling_items[1].quantity_sold).toEqual(1);
    expect(result.top_selling_items[1].revenue).toEqual(22.50);
  });

  it('should filter transactions by date range correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier1@test.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test category and menu item
    const categories = await db.insert(menuCategoriesTable)
      .values({
        name: 'Drinks',
        description: 'Beverages'
      })
      .returning()
      .execute();

    const menuItems = await db.insert(menuItemsTable)
      .values({
        name: 'Coffee',
        description: 'Hot coffee',
        price: '5.00',
        category_id: categories[0].id,
        preparation_time: 5
      })
      .returning()
      .execute();

    // Create transactions - one inside range, one outside
    const transactions = await db.insert(salesTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          total_amount: '5.00',
          tax_amount: '0.50',
          discount_amount: '0.00',
          final_amount: '5.50',
          payment_method: 'cash',
          status: 'completed',
          cashier_id: userId,
          completed_at: new Date('2024-01-15T12:00:00Z') // Inside range
        },
        {
          transaction_number: 'TXN002',
          total_amount: '5.00',
          tax_amount: '0.50',
          discount_amount: '0.00',
          final_amount: '5.50',
          payment_method: 'cash',
          status: 'completed',
          cashier_id: userId,
          completed_at: new Date('2024-02-15T12:00:00Z') // Outside range
        }
      ])
      .returning()
      .execute();

    await db.insert(salesTransactionItemsTable)
      .values([
        {
          transaction_id: transactions[0].id,
          menu_item_id: menuItems[0].id,
          quantity: 1,
          unit_price: '5.00',
          total_price: '5.00'
        },
        {
          transaction_id: transactions[1].id,
          menu_item_id: menuItems[0].id,
          quantity: 1,
          unit_price: '5.00',
          total_price: '5.00'
        }
      ])
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSalesReport(input);

    // Should only include the January transaction
    expect(result.total_sales).toEqual(5.50);
    expect(result.total_transactions).toEqual(1);
    expect(result.top_selling_items).toHaveLength(1);
    expect(result.top_selling_items[0].quantity_sold).toEqual(1);
  });

  it('should exclude non-completed transactions', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier1@test.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test category and menu item
    const categories = await db.insert(menuCategoriesTable)
      .values({
        name: 'Snacks',
        description: 'Light snacks'
      })
      .returning()
      .execute();

    const menuItems = await db.insert(menuItemsTable)
      .values({
        name: 'Chips',
        price: '3.50',
        category_id: categories[0].id,
        preparation_time: 2
      })
      .returning()
      .execute();

    // Create transactions with different statuses
    await db.insert(salesTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          total_amount: '3.50',
          tax_amount: '0.35',
          discount_amount: '0.00',
          final_amount: '3.85',
          payment_method: 'cash',
          status: 'completed',
          cashier_id: userId,
          completed_at: new Date('2024-01-15T12:00:00Z')
        },
        {
          transaction_number: 'TXN002',
          total_amount: '3.50',
          tax_amount: '0.35',
          discount_amount: '0.00',
          final_amount: '3.85',
          payment_method: 'cash',
          status: 'pending',
          cashier_id: userId
        }
      ])
      .execute();

    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSalesReport(input);

    // Should only include completed transaction
    expect(result.total_sales).toEqual(3.85);
    expect(result.total_transactions).toEqual(1);
  });
});
