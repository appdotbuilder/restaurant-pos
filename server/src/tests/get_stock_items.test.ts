
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type CreateStockItemInput } from '../schema';
import { getStockItems } from '../handlers/get_stock_items';

const testStockItem1: CreateStockItemInput = {
  name: 'Flour',
  description: 'All-purpose flour',
  unit: 'kg',
  current_quantity: 50.5,
  minimum_quantity: 10.0,
  unit_cost: 2.50,
  supplier: 'Grain Co'
};

const testStockItem2: CreateStockItemInput = {
  name: 'Sugar',
  description: 'White granulated sugar',
  unit: 'kg',
  current_quantity: 5.0,
  minimum_quantity: 15.0,
  unit_cost: 1.75,
  supplier: 'Sweet Supply'
};

describe('getStockItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no stock items exist', async () => {
    const result = await getStockItems();
    expect(result).toEqual([]);
  });

  it('should return all stock items with correct numeric conversions', async () => {
    // Create test stock items
    await db.insert(stockItemsTable)
      .values([
        {
          name: testStockItem1.name,
          description: testStockItem1.description,
          unit: testStockItem1.unit,
          current_quantity: testStockItem1.current_quantity.toString(),
          minimum_quantity: testStockItem1.minimum_quantity.toString(),
          unit_cost: testStockItem1.unit_cost.toString(),
          supplier: testStockItem1.supplier
        },
        {
          name: testStockItem2.name,
          description: testStockItem2.description,
          unit: testStockItem2.unit,
          current_quantity: testStockItem2.current_quantity.toString(),
          minimum_quantity: testStockItem2.minimum_quantity.toString(),
          unit_cost: testStockItem2.unit_cost.toString(),
          supplier: testStockItem2.supplier
        }
      ])
      .execute();

    const result = await getStockItems();

    expect(result).toHaveLength(2);

    // Check first item
    const flourItem = result.find(item => item.name === 'Flour');
    expect(flourItem).toBeDefined();
    expect(flourItem!.name).toEqual('Flour');
    expect(flourItem!.description).toEqual('All-purpose flour');
    expect(flourItem!.unit).toEqual('kg');
    expect(flourItem!.current_quantity).toEqual(50.5);
    expect(typeof flourItem!.current_quantity).toBe('number');
    expect(flourItem!.minimum_quantity).toEqual(10.0);
    expect(typeof flourItem!.minimum_quantity).toBe('number');
    expect(flourItem!.unit_cost).toEqual(2.50);
    expect(typeof flourItem!.unit_cost).toBe('number');
    expect(flourItem!.supplier).toEqual('Grain Co');
    expect(flourItem!.id).toBeDefined();
    expect(flourItem!.created_at).toBeInstanceOf(Date);

    // Check second item
    const sugarItem = result.find(item => item.name === 'Sugar');
    expect(sugarItem).toBeDefined();
    expect(sugarItem!.name).toEqual('Sugar');
    expect(sugarItem!.current_quantity).toEqual(5.0);
    expect(sugarItem!.minimum_quantity).toEqual(15.0);
    expect(sugarItem!.unit_cost).toEqual(1.75);
  });

  it('should handle items with null description and supplier', async () => {
    await db.insert(stockItemsTable)
      .values({
        name: 'Basic Item',
        description: null,
        unit: 'pieces',
        current_quantity: '100.0',
        minimum_quantity: '20.0',
        unit_cost: '0.50',
        supplier: null
      })
      .execute();

    const result = await getStockItems();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Item');
    expect(result[0].description).toBeNull();
    expect(result[0].supplier).toBeNull();
    expect(result[0].current_quantity).toEqual(100.0);
    expect(result[0].minimum_quantity).toEqual(20.0);
    expect(result[0].unit_cost).toEqual(0.50);
  });

  it('should return items in creation order', async () => {
    // Create items with slight delay to ensure different timestamps
    await db.insert(stockItemsTable)
      .values({
        name: 'First Item',
        description: 'Created first',
        unit: 'kg',
        current_quantity: '10.0',
        minimum_quantity: '5.0',
        unit_cost: '1.00',
        supplier: 'Supplier A'
      })
      .execute();

    await db.insert(stockItemsTable)
      .values({
        name: 'Second Item',
        description: 'Created second',
        unit: 'liter',
        current_quantity: '20.0',
        minimum_quantity: '8.0',
        unit_cost: '2.00',
        supplier: 'Supplier B'
      })
      .execute();

    const result = await getStockItems();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Item');
    expect(result[1].name).toEqual('Second Item');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
