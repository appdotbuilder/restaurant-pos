
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, menuCategoriesTable, menuItemsTable, stockItemsTable, salesTransactionsTable, salesTransactionItemsTable } from '../db/schema';
import { type CreateSalesTransactionInput } from '../schema';
import { createSalesTransaction } from '../handlers/create_sales_transaction';
import { eq } from 'drizzle-orm';

describe('createSalesTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let menuItemId1: number;
  let menuItemId2: number;
  let cashierId: number;

  beforeEach(async () => {
    // Create test cashier
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();
    cashierId = cashierResult[0].id;

    // Create test category
    const categoryResult = await db.insert(menuCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test menu items
    const menuItem1Result = await db.insert(menuItemsTable)
      .values({
        name: 'Burger',
        description: 'Test burger',
        price: '15.99',
        category_id: categoryId,
        preparation_time: 10
      })
      .returning()
      .execute();
    menuItemId1 = menuItem1Result[0].id;

    const menuItem2Result = await db.insert(menuItemsTable)
      .values({
        name: 'Fries',
        description: 'Test fries',
        price: '8.50',
        category_id: categoryId,
        preparation_time: 5
      })
      .returning()
      .execute();
    menuItemId2 = menuItem2Result[0].id;

    // Create stock items for menu items
    await db.insert(stockItemsTable)
      .values({
        name: 'burger',
        description: 'Burger patties',
        unit: 'pieces',
        current_quantity: '50.000',
        minimum_quantity: '10.000',
        unit_cost: '5.00'
      })
      .execute();

    await db.insert(stockItemsTable)
      .values({
        name: 'fries',
        description: 'French fries',
        unit: 'portions',
        current_quantity: '100.000',
        minimum_quantity: '20.000',
        unit_cost: '2.00'
      })
      .execute();
  });

  it('should create a sales transaction with multiple items', async () => {
    const input: CreateSalesTransactionInput = {
      customer_name: 'John Doe',
      payment_method: 'cash',
      discount_amount: 2.00,
      items: [
        { menu_item_id: menuItemId1, quantity: 2 },
        { menu_item_id: menuItemId2, quantity: 1 }
      ]
    };

    const result = await createSalesTransaction(input);

    // Basic transaction validation
    expect(result.customer_name).toEqual('John Doe');
    expect(result.payment_method).toEqual('cash');
    expect(result.discount_amount).toEqual(2.00);
    expect(result.status).toEqual('completed');
    expect(result.cashier_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.transaction_number).toMatch(/^TXN-\d+-[a-z0-9]+$/);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeInstanceOf(Date);

    // Calculate expected totals: (15.99 * 2) + (8.50 * 1) = 40.48
    const expectedTotal = 40.48;
    const expectedTax = expectedTotal * 0.08; // 3.2384
    const expectedFinal = expectedTotal + expectedTax - 2.00; // 41.7184

    expect(result.total_amount).toBeCloseTo(expectedTotal, 2);
    expect(result.tax_amount).toBeCloseTo(expectedTax, 2);
    expect(result.final_amount).toBeCloseTo(expectedFinal, 2);
    expect(typeof result.total_amount).toBe('number');
  });

  it('should create transaction items in database', async () => {
    const input: CreateSalesTransactionInput = {
      customer_name: 'Jane Smith',
      payment_method: 'card',
      discount_amount: 0,
      items: [
        { menu_item_id: menuItemId1, quantity: 1 },
        { menu_item_id: menuItemId2, quantity: 2 }
      ]
    };

    const result = await createSalesTransaction(input);

    // Verify transaction was saved
    const transactions = await db.select()
      .from(salesTransactionsTable)
      .where(eq(salesTransactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].customer_name).toEqual('Jane Smith');
    
    // Calculate expected total: (15.99 * 1) + (8.50 * 2) = 32.99
    expect(parseFloat(transactions[0].total_amount)).toBeCloseTo(32.99, 2);

    // Verify transaction items were created
    const transactionItems = await db.select()
      .from(salesTransactionItemsTable)
      .where(eq(salesTransactionItemsTable.transaction_id, result.id))
      .execute();

    expect(transactionItems).toHaveLength(2);
    
    // Check burger item
    const burgerItem = transactionItems.find(item => item.menu_item_id === menuItemId1);
    expect(burgerItem).toBeDefined();
    expect(burgerItem!.quantity).toEqual(1);
    expect(parseFloat(burgerItem!.unit_price)).toEqual(15.99);
    expect(parseFloat(burgerItem!.total_price)).toEqual(15.99);

    // Check fries item
    const friesItem = transactionItems.find(item => item.menu_item_id === menuItemId2);
    expect(friesItem).toBeDefined();
    expect(friesItem!.quantity).toEqual(2);
    expect(parseFloat(friesItem!.unit_price)).toEqual(8.50);
    expect(parseFloat(friesItem!.total_price)).toEqual(17.00);
  });

  it('should update stock quantities after sale', async () => {
    const input: CreateSalesTransactionInput = {
      customer_name: 'Stock Test',
      payment_method: 'cash',
      discount_amount: 0,
      items: [
        { menu_item_id: menuItemId1, quantity: 3 },
        { menu_item_id: menuItemId2, quantity: 5 }
      ]
    };

    await createSalesTransaction(input);

    // Check stock was updated
    const stockItems = await db.select()
      .from(stockItemsTable)
      .execute();

    const burgerStock = stockItems.find(item => item.name === 'burger');
    const friesStock = stockItems.find(item => item.name === 'fries');

    expect(burgerStock).toBeDefined();
    expect(parseFloat(burgerStock!.current_quantity)).toEqual(47); // 50 - 3
    
    expect(friesStock).toBeDefined();
    expect(parseFloat(friesStock!.current_quantity)).toEqual(95); // 100 - 5
  });

  it('should throw error for non-existent menu item', async () => {
    const input: CreateSalesTransactionInput = {
      customer_name: 'Error Test',
      payment_method: 'cash',
      discount_amount: 0,
      items: [
        { menu_item_id: 99999, quantity: 1 }
      ]
    };

    await expect(createSalesTransaction(input)).rejects.toThrow(/menu item.*not found/i);
  });

  it('should throw error for unavailable menu item', async () => {
    // Make menu item unavailable
    await db.update(menuItemsTable)
      .set({ is_available: false })
      .where(eq(menuItemsTable.id, menuItemId1))
      .execute();

    const input: CreateSalesTransactionInput = {
      customer_name: 'Unavailable Test',
      payment_method: 'cash',
      discount_amount: 0,
      items: [
        { menu_item_id: menuItemId1, quantity: 1 }
      ]
    };

    await expect(createSalesTransaction(input)).rejects.toThrow(/not available/i);
  });

  it('should throw error for insufficient stock', async () => {
    const input: CreateSalesTransactionInput = {
      customer_name: 'Stock Error Test',
      payment_method: 'cash',
      discount_amount: 0,
      items: [
        { menu_item_id: menuItemId1, quantity: 100 } // More than available stock (50)
      ]
    };

    await expect(createSalesTransaction(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should handle null customer name', async () => {
    const input: CreateSalesTransactionInput = {
      customer_name: null,
      payment_method: 'card',
      discount_amount: 1.50,
      items: [
        { menu_item_id: menuItemId2, quantity: 1 }
      ]
    };

    const result = await createSalesTransaction(input);

    expect(result.customer_name).toBeNull();
    expect(result.payment_method).toEqual('card');
    expect(result.total_amount).toEqual(8.50);
    expect(result.discount_amount).toEqual(1.50);
  });
});
