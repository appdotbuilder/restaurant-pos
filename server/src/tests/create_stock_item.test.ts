
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type CreateStockItemInput } from '../schema';
import { createStockItem } from '../handlers/create_stock_item';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateStockItemInput = {
  name: 'Test Ingredient',
  description: 'A test ingredient for cooking',
  unit: 'kg',
  current_quantity: 50.5,
  minimum_quantity: 10.0,
  unit_cost: 15.75,
  supplier: 'Test Supplier Co.'
};

describe('createStockItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a stock item', async () => {
    const result = await createStockItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Ingredient');
    expect(result.description).toEqual(testInput.description);
    expect(result.unit).toEqual('kg');
    expect(result.current_quantity).toEqual(50.5);
    expect(result.minimum_quantity).toEqual(10.0);
    expect(result.unit_cost).toEqual(15.75);
    expect(result.supplier).toEqual('Test Supplier Co.');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_restocked_at).toBeNull();
  });

  it('should save stock item to database', async () => {
    const result = await createStockItem(testInput);

    // Query database to verify save
    const stockItems = await db.select()
      .from(stockItemsTable)
      .where(eq(stockItemsTable.id, result.id))
      .execute();

    expect(stockItems).toHaveLength(1);
    const stockItem = stockItems[0];
    expect(stockItem.name).toEqual('Test Ingredient');
    expect(stockItem.description).toEqual(testInput.description);
    expect(stockItem.unit).toEqual('kg');
    expect(parseFloat(stockItem.current_quantity)).toEqual(50.5);
    expect(parseFloat(stockItem.minimum_quantity)).toEqual(10.0);
    expect(parseFloat(stockItem.unit_cost)).toEqual(15.75);
    expect(stockItem.supplier).toEqual('Test Supplier Co.');
    expect(stockItem.created_at).toBeInstanceOf(Date);
    expect(stockItem.last_restocked_at).toBeNull();
  });

  it('should handle null description and supplier', async () => {
    const inputWithNulls: CreateStockItemInput = {
      name: 'Basic Item',
      description: null,
      unit: 'pieces',
      current_quantity: 100,
      minimum_quantity: 20,
      unit_cost: 5.00,
      supplier: null
    };

    const result = await createStockItem(inputWithNulls);

    expect(result.name).toEqual('Basic Item');
    expect(result.description).toBeNull();
    expect(result.supplier).toBeNull();
    expect(result.unit).toEqual('pieces');
    expect(result.current_quantity).toEqual(100);
    expect(result.minimum_quantity).toEqual(20);
    expect(result.unit_cost).toEqual(5.00);
  });

  it('should verify numeric types are correctly handled', async () => {
    const result = await createStockItem(testInput);

    // Verify all numeric fields are actually numbers, not strings
    expect(typeof result.current_quantity).toBe('number');
    expect(typeof result.minimum_quantity).toBe('number');
    expect(typeof result.unit_cost).toBe('number');
    expect(typeof result.id).toBe('number');
  });

  it('should handle decimal quantities correctly', async () => {
    const decimalInput: CreateStockItemInput = {
      name: 'Decimal Test Item',
      description: 'Testing decimal precision',
      unit: 'liters',
      current_quantity: 25.123,
      minimum_quantity: 5.456,
      unit_cost: 12.99,
      supplier: 'Decimal Supplier'
    };

    const result = await createStockItem(decimalInput);

    expect(result.current_quantity).toEqual(25.123);
    expect(result.minimum_quantity).toEqual(5.456);
    expect(result.unit_cost).toEqual(12.99);

    // Verify precision is maintained in database
    const stockItems = await db.select()
      .from(stockItemsTable)
      .where(eq(stockItemsTable.id, result.id))
      .execute();

    const stockItem = stockItems[0];
    expect(parseFloat(stockItem.current_quantity)).toEqual(25.123);
    expect(parseFloat(stockItem.minimum_quantity)).toEqual(5.456);
    expect(parseFloat(stockItem.unit_cost)).toEqual(12.99);
  });
});
